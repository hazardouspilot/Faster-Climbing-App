import logging
import json
import azure.functions as func
from shared.db_pymssql import AzureSQLDB
import os

allowed_origin = os.environ.get('ALLOWED_ORIGIN', '*')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': allowed_origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Username'
}

def main(req: func.HttpRequest) -> func.HttpResponse:
    db = AzureSQLDB()

    # Simple auth: require X-Username header
    username = req.headers.get('x-username')

    if req.method == 'OPTIONS':
        return func.HttpResponse("", status_code=200, headers=CORS_HEADERS)

    if req.method == 'GET':
        # Query params: company, suburb, location, type_column
        company = req.params.get('company')
        suburb = req.params.get('suburb')
        location = req.params.get('location')
        type_column = req.params.get('type_column')
        # Only show non-archived (Existing=1)
        sql = ("SELECT RID, CreationDate, CompanyName, Suburb, Location, GradingSystem, Grade, Type_column, Colour, NumberHolds "
               "FROM Routes WHERE Existing=1 AND CompanyName=%s AND Suburb=%s AND Location=%s AND Type_column=%s")
        try:
            routes = db.fetch_all(sql, (company, suburb, location, type_column))
            # Convert date objects to string for JSON serialization
            for route in routes:
                if 'CreationDate' in route and route['CreationDate'] is not None:
                    route['CreationDate'] = str(route['CreationDate'])
            return func.HttpResponse(
                json.dumps({'routes': routes}),
                status_code=200,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        except Exception as e:
            logging.error(f"Error fetching routes: {str(e)}")
            return func.HttpResponse(
                json.dumps({'error': str(e)}),
                status_code=500,
                mimetype='application/json',
                headers=CORS_HEADERS
            )

    if req.method == 'POST':
        username = req.headers.get('x-username')
        if not username:
            return func.HttpResponse(
                json.dumps({'error': 'Authentication required'}),
                status_code=401,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        try:
            req_body = req.get_json()
            action = req_body.get('action', '').lower()
            if action == 'archive':
                # Archive a route: set Existing = 0 for the given RID
                rid = req_body.get('rid')
                if not rid:
                    return func.HttpResponse(
                        json.dumps({'error': 'RID is required to archive a route'}),
                        status_code=400,
                        mimetype='application/json',
                        headers=CORS_HEADERS
                    )
                sql = "UPDATE Routes SET Existing=0 WHERE RID=%s"
                db.execute(sql, (rid,))
                return func.HttpResponse(
                    json.dumps({'message': f'Route {rid} archived successfully'}),
                    status_code=200,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            elif action == 'add':
                # Add one or multiple new routes
                routes = req_body.get('routes')
                if not routes:
                    # Support single route as dict
                    single_route = req_body.get('route')
                    if single_route:
                        routes = [single_route]
                if not routes or not isinstance(routes, list):
                    return func.HttpResponse(
                        json.dumps({'error': 'No routes provided'}),
                        status_code=400,
                        mimetype='application/json',
                        headers=CORS_HEADERS
                    )
                # Prepare SQL for inserting with GradingSystem
                sql = ("INSERT INTO Routes (CreationDate, CompanyName, Suburb, Location, GradingSystem, Grade, Type_column, Colour, NumberHolds, Existing) "
                       "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1)")
                inserted = 0
                for route in routes:
                    # Infer GradingSystem from Company and type_column
                    company_name = route.get('companyName')
                    type_col = route.get('type_column')
                    if type_col and type_col.lower() == 'boulder':
                        sql_gs = "SELECT BoulderGradeSystem FROM Companys WHERE CompanyName=%s"
                        gs_row = db.fetch_all(sql_gs, (company_name,))
                        grading_system = gs_row[0]['BoulderGradeSystem'] if gs_row else None
                    else:
                        sql_gs = "SELECT SportGradeSystem FROM Companys WHERE CompanyName=%s"
                        gs_row = db.fetch_all(sql_gs, (company_name,))
                        grading_system = gs_row[0]['SportGradeSystem'] if gs_row else None
                    if not grading_system:
                        return func.HttpResponse(
                            json.dumps({'error': f'Could not determine grading system for company {company_name} and type {type_col}'}),
                            status_code=400,
                            mimetype='application/json',
                            headers=CORS_HEADERS
                        )
                    db.execute(sql, (
                        route.get('creationDate'),
                        company_name,
                        route.get('suburb'),
                        route.get('location'),
                        grading_system,
                        route.get('grade'),
                        type_col,
                        route.get('colour'),
                        route.get('numberHolds', 0)
                    ))
                    inserted += 1
                return func.HttpResponse(
                    json.dumps({'message': f'{inserted} route(s) added successfully'}),
                    status_code=201,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            else:
                return func.HttpResponse(
                    json.dumps({'error': 'Invalid action. Use "archive" or "add".'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
        except Exception as e:
            logging.error(f"Error in POST /routes: {str(e)}")
            return func.HttpResponse(
                json.dumps({'error': str(e)}),
                status_code=500,
                mimetype='application/json',
                headers=CORS_HEADERS
            )

    return func.HttpResponse(
        json.dumps({'error': 'Method not allowed'}),
        status_code=405,
        mimetype='application/json',
        headers=CORS_HEADERS
    )
