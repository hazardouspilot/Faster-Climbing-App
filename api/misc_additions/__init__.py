import logging
import json
import azure.functions as func
import pymssql
from shared.db_pymssql import AzureSQLDB
import os

allowed_origin = os.environ.get('ALLOWED_ORIGIN', '*')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': allowed_origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Username'
}

def main(req: func.HttpRequest) -> func.HttpResponse:
    db = AzureSQLDB()
    username = req.headers.get('x-username')

    if req.method == 'OPTIONS':
        return func.HttpResponse("", status_code=200, headers=CORS_HEADERS)

    if req.method == 'POST':
        if not username:
            return func.HttpResponse(
                json.dumps({'error': 'Authentication required'}),
                status_code=401,
                mimetype='application/json',
                headers=CORS_HEADERS
        )

        try:
            req_body = req.get_json()
            entity = req_body.get('entity')
            data = req_body.get('data')
            if entity == 'company':
                sql = ("INSERT INTO Companys (CompanyName, BoulderGradeSystem, SportGradeSystem, PrimaryCountry) "
                       "VALUES (%s, %s, %s, %s)")
                db.execute(sql, (
                    data.get('companyName'),
                    data.get('boulderGradeSystem'),
                    data.get('sportGradeSystem'),
                    data.get('primaryCountry')
                ))
                return func.HttpResponse(
                    json.dumps({'message': 'Company added'}),
                    status_code=201,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            elif entity == 'gym':
                sql = ("INSERT INTO Gyms (CompanyName, Suburb, City, Country) "
                       "VALUES (%s, %s, %s, %s)")
                db.execute(sql, (
                    data.get('companyName'),
                    data.get('suburb'),
                    data.get('city'),
                    data.get('country')
                ))
                return func.HttpResponse(
                    json.dumps({'message': 'Gym added'}),
                    status_code=201,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            elif entity == 'location':
                company_name = req_body.get('companyName')
                suburb = req_body.get('suburb')
                locations = data if isinstance(data, list) else [data] #do I need to include type here somehow%s
                sql = ("INSERT INTO Locations (CompanyName, Suburb, Location, Type) "
                       "VALUES (%s, %s, %s, %s)")
                inserted = 0
                for loc in locations:
                    db.execute(sql, (
                        company_name,
                        suburb,
                        loc.get('location'),
                        loc.get('type', 'not specified')
                    ))
                    inserted += 1
                return func.HttpResponse(
                    json.dumps({'message': f'{inserted} location(s) added'}),
                    status_code=201,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            elif entity == 'colour':
                sql = ("INSERT INTO Colours (CompanyName, Colour) VALUES (%s, %s)")
                db.execute(sql, (
                    data.get('companyName'),
                    data.get('colour')
                ))
                return func.HttpResponse(
                    json.dumps({'message': 'Colour added'}),
                    status_code=201,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            else:
                return func.HttpResponse(
                    json.dumps({'error': 'Invalid entity type'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
        except Exception as e:
            logging.error(f"Error adding entity: {str(e)}")
            return func.HttpResponse(
                json.dumps({'error': str(e)}),
                status_code=500,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
    elif req.method == 'GET':
        # Accept query param: entity=company/gym/location
        entity = req.params.get('entity')
        company = req.params.get('company')
        suburb = req.params.get('suburb')
        
        results = []
        if entity == 'climbtype_location':
            if not (company and suburb):
                return func.HttpResponse(
                    json.dumps({'error': 'company and suburb are required for climbtype_location'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            sql = "SELECT DISTINCT Type as ClimbType FROM Locations WHERE CompanyName=%s AND Suburb=%s ORDER BY Type"
            climbtypes = db.fetch_all(sql, (company, suburb))
            sql2 = "SELECT Location, Type as ClimbType FROM Locations WHERE CompanyName=%s AND Suburb=%s ORDER BY Location"
            locations = db.fetch_all(sql2, (company, suburb))
            return func.HttpResponse(
                json.dumps({'climbtypes': climbtypes, 'locations': locations}),
                status_code=200,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        elif entity == 'grade_system':
            sql = "SELECT GradingSystem FROM GradeSystems"
            results = db.fetch_all(sql)
        elif entity == 'company':
            sql = "SELECT CompanyName FROM Companys ORDER BY CompanyName"
            results = db.fetch_all(sql)
        elif entity == 'gym':
            if not company:
                return func.HttpResponse(
                    json.dumps({'error': 'company is required for gyms'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            sql = "SELECT Suburb FROM Gyms WHERE CompanyName=%s ORDER BY Suburb"
            results = db.fetch_all(sql, (company,))
        elif entity == 'location':
            if not (company and suburb):
                return func.HttpResponse(
                    json.dumps({'error': 'company and suburb are required for locations'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            sql = "SELECT Location, Type as ClimbType FROM Locations WHERE CompanyName=%s AND Suburb=%s ORDER BY Location"
            results = db.fetch_all(sql, (company, suburb))
        elif entity == 'grades':
            # Requires: company, suburb, climbType
            if not (company and suburb and req.params.get('climbType')):
                return func.HttpResponse(
                    json.dumps({'error': 'company, suburb, and climbType are required for grades'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            climb_type = req.params.get('climbType')
            # Determine grading system
            if climb_type.lower() == 'boulder':
                sql_gs = "SELECT BoulderGradeSystem FROM Companys WHERE CompanyName=%s"
                gs_row = db.fetch_all(sql_gs, (company,))
                grading_system = gs_row[0]['BoulderGradeSystem'] if gs_row else None
            else:
                sql_gs = "SELECT SportGradeSystem FROM Companys WHERE CompanyName=%s"
                gs_row = db.fetch_all(sql_gs, (company,))
                grading_system = gs_row[0]['SportGradeSystem'] if gs_row else None
            if not grading_system:
                return func.HttpResponse(
                    json.dumps({'error': f'Could not determine grading system for company {company} and type {climb_type}'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            sql = "SELECT Grade, GradeOrder FROM Grades WHERE GradingSystem=%s ORDER BY GradeOrder"
            results = db.fetch_all(sql, (grading_system,))
            return func.HttpResponse(
                json.dumps({'results': results}),
                status_code=200,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        elif entity == 'colours':
            # Requires: company
            if not company:
                return func.HttpResponse(
                    json.dumps({'error': 'company is required for colours'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            sql = "SELECT Colour FROM Colours WHERE CompanyName=%s ORDER BY Colour"
            results = db.fetch_all(sql, (company,))
            return func.HttpResponse(
                json.dumps({'results': results}),
                status_code=200,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        elif entity == 'mode':
            sql = "SELECT Mode_column FROM Modes ORDER BY Mode_column"
            results = db.fetch_all(sql)
            return func.HttpResponse(
                json.dumps({'results': results}),
                status_code=200,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        elif entity == 'result':
            sql = "SELECT Result FROM Results ORDER BY Result"
            results = db.fetch_all(sql)
            return func.HttpResponse(
                json.dumps({'results': results}),
                status_code=200,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        else:
            return func.HttpResponse(
                json.dumps({'error': 'Invalid or missing entity parameter'}),
                status_code=400,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        return func.HttpResponse(
            json.dumps({'results': results}),
            status_code=200,
            mimetype='application/json',
            headers=CORS_HEADERS
        )
    return func.HttpResponse(
        json.dumps({'error': 'Method not allowed'}),
        status_code=405,
        mimetype='application/json',
        headers=CORS_HEADERS
    )
