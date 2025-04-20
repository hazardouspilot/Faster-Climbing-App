import logging
import json
import azure.functions as func
from shared.db import AzureSQLDB

CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Username'
}

def main(req: func.HttpRequest) -> func.HttpResponse:
    db = AzureSQLDB()
    username = req.headers.get('x-username')
    if not username:
        return func.HttpResponse(
            json.dumps({'error': 'Authentication required'}),
            status_code=401,
            mimetype='application/json',
            headers=CORS_HEADERS
        )

    if req.method == 'OPTIONS':
        return func.HttpResponse("", status_code=204, headers=CORS_HEADERS)

    if req.method == 'POST':
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

            # Find the next AttemptNo for this user/route/mode
            sql_attempt = "SELECT MAX(AttemptNo) FROM Attempts WHERE Username=? AND RID=? AND Mode_column=?"
            row = db.fetch_one(sql_attempt, (username, rid, mode))
            next_attempt = 1 if not row or row[0] is None else row[0] + 1

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
    return func.HttpResponse(
        json.dumps({'error': 'Method not allowed'}),
        status_code=405,
        mimetype='application/json',
        headers=CORS_HEADERS
    )
