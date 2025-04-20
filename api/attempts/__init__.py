import logging
import json
import azure.functions as func
from shared.db import AzureSQLDB

CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
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
            rid = req_body.get('rid')
            mode = req_body.get('mode')
            date = req_body.get('date')
            time_val = req_body.get('time')
            result = req_body.get('result')
            rating = req_body.get('rating', 0)
            notes = req_body.get('notes', '')
            video = req_body.get('video', None)
            attempt_no = req_body.get('attemptNo')  # User-selected attempt number

            # Fetch current max AttemptNo for this user/route/mode
            sql_attempt = "SELECT MAX(AttemptNo) as max_attempt FROM Attempts WHERE Username=? AND RID=? AND Mode_column=?"
            row = db.fetch_all(sql_attempt, (username, rid, mode))
            max_attempt = row[0]['max_attempt'] if row and row[0]['max_attempt'] is not None else 0

            # If user provides attemptNo, validate it
            if attempt_no is not None:
                if attempt_no <= max_attempt:
                    return func.HttpResponse(
                        json.dumps({'error': f'Attempt number must be greater than your current highest attempt ({max_attempt}) for this route/mode.'}),
                        status_code=400,
                        mimetype='application/json',
                        headers=CORS_HEADERS
                    )
                next_attempt = attempt_no
            else:
                next_attempt = max_attempt + 1

            sql_insert = ("INSERT INTO Attempts (Username, RID, Mode_column, AttemptNo, Date_column, Time_column, Result, Rating, Notes, Video) "
                          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            db.execute(sql_insert, (username, rid, mode, next_attempt, date, time_val, result, rating, notes, video))
            return func.HttpResponse(
                json.dumps({'message': 'Attempt added', 'attempt_no': next_attempt}),
                status_code=201,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        except Exception as e:
            logging.error(f"Error adding attempt: {str(e)}")
            return func.HttpResponse(
                json.dumps({'error': str(e)}),
                status_code=500,
                mimetype='application/json',
                headers=CORS_HEADERS
            )

    if req.method == 'GET':
        # Query params: username, company, suburb, location, type_column
        username = req.params.get('username')
        company = req.params.get('company')
        suburb = req.params.get('suburb')
        location = req.params.get('location')
        type_column = req.params.get('type_column')
        if not (username and company and suburb and location and type_column):
            return func.HttpResponse(
                json.dumps({'error': 'Missing required parameters'}),
                status_code=400,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        sql = ("SELECT A.RID, R.Grade, R.Colour, A.Mode_column, A.Result, A.Notes, A.Date_column, A.Time_column "
               "FROM Attempts A "
               "JOIN Routes R ON A.RID = R.RID "
               "WHERE A.Username=? AND R.CompanyName=? AND R.Suburb=? AND R.Location=? AND R.Type_column=? AND R.Existing=1 "
               "ORDER BY A.Date_column DESC, A.Time_column DESC")
        attempts = db.fetch_all(sql, (username, company, suburb, location, type_column))
        # Convert date/time to string for JSON serialization
        for attempt in attempts:
            if 'Date_column' in attempt and attempt['Date_column'] is not None:
                attempt['Date_column'] = str(attempt['Date_column'])
            if 'Time_column' in attempt and attempt['Time_column'] is not None:
                attempt['Time_column'] = str(attempt['Time_column'])
        return func.HttpResponse(
            json.dumps({'attempts': attempts}),
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
