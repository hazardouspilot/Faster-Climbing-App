import logging
import json
import azure.functions as func
from shared.db import AzureSQLDB
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
        # Dashboard/Projects: hardest unfinished projects
        if req.params.get('dashboard') == 'projects':
            username = req.params.get('username')
            company = req.params.get('company')
            suburb = req.params.get('suburb')
            type_column = req.params.get('type_column')
            if not (username and company and suburb and type_column):
                return func.HttpResponse(
                    json.dumps({'error': 'Missing required parameters'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            # Only include route-mode combos where user has never sent it in that mode
            mode_priority = "CASE WHEN A.Mode_column = 'Lead' THEN 1 WHEN A.Mode_column = 'Top Rope' THEN 2 WHEN A.Mode_column = 'Auto-belay' THEN 3 ELSE 4 END"
            sql = f"""
                SELECT TOP 5
                    R.RID,
                    R.Grade,
                    R.Colour,
                    R.Location,
                    R.GradingSystem,
                    G.GradeOrder,
                    A.Mode_column,
                    COUNT(*) as Attempts,
                    MAX(A.Date_column) as LastAttempt,
                    BestAttempt.BestResult
                FROM Attempts A
                JOIN Routes R ON A.RID = R.RID
                JOIN Grades G ON R.Grade = G.Grade AND R.GradingSystem = G.GradingSystem
                OUTER APPLY (
                    SELECT TOP 1 A2.Result AS BestResult
                    FROM Attempts A2
                    JOIN Results RS ON A2.Result = RS.Result
                    WHERE A2.Username = A.Username
                      AND A2.RID = A.RID
                      AND A2.Mode_column = A.Mode_column
                    ORDER BY RS.ResultOrder DESC
                ) AS BestAttempt
                WHERE A.Username=?
                  AND R.CompanyName=?
                  AND R.Suburb=?
                  AND R.Type_column=?
                  AND R.Existing=1
                  AND NOT EXISTS (
                    SELECT 1 FROM Attempts A2
                    WHERE A2.Username = A.Username
                      AND A2.RID = A.RID
                      AND A2.Mode_column = A.Mode_column
                      AND A2.Result = 'Sent'
                  )
                GROUP BY
                    R.RID,
                    R.Grade,
                    R.Colour,
                    R.Location,
                    R.GradingSystem,
                    G.GradeOrder,
                    A.Mode_column,
                    BestAttempt.BestResult
                ORDER BY
                    G.GradeOrder DESC,
                    {mode_priority},
                    R.RID,
                    Attempts DESC
            """
            attempts = db.fetch_all(sql, (username, company, suburb, type_column))
            for attempt in attempts:
                if 'LastAttempt' in attempt and attempt['LastAttempt'] is not None:
                    attempt['LastAttempt'] = str(attempt['LastAttempt'])
            return func.HttpResponse(
                json.dumps({'projects': attempts}),
                status_code=200,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
        # All attempts sorted by difficulty for user on all current routes (all locations)
        elif req.params.get('dashboard') == 'all_attempts_sorted':
            username = req.params.get('username')
            company = req.params.get('company')
            suburb = req.params.get('suburb')
            type_column = req.params.get('type_column')
            if not (username and company and suburb and type_column):
                return func.HttpResponse(
                    json.dumps({'error': 'Missing required parameters'}),
                    status_code=400,
                    mimetype='application/json',
                    headers=CORS_HEADERS
                )
            mode_priority = "CASE WHEN A.Mode_column = 'Lead' THEN 1 WHEN A.Mode_column = 'Top Rope' THEN 2 WHEN A.Mode_column = 'Auto-belay' THEN 3 ELSE 4 END"
            sql = f"""
                SELECT R.RID, R.Grade, R.Colour, R.Location, G.GradeOrder, A.Mode_column, A.AttemptNo, A.Result, A.Notes, A.Date_column, A.Time_column
                FROM Attempts A
                JOIN Routes R ON A.RID = R.RID
                JOIN Grades G ON R.Grade = G.Grade AND R.GradingSystem = G.GradingSystem
                WHERE A.Username=? AND R.CompanyName=? AND R.Suburb=? AND R.Type_column=? AND R.Existing=1
                ORDER BY G.GradeOrder DESC, R.RID, {mode_priority}, A.AttemptNo DESC
            """
            attempts = db.fetch_all(sql, (username, company, suburb, type_column))
            for attempt in attempts:
                if 'Date_column' in attempt and attempt['Date_column'] is not None:
                    attempt['Date_column'] = str(attempt['Date_column'])
                if 'Time_column' in attempt and attempt['Time_column'] is not None:
                    attempt['Time_column'] = str(attempt['Time_column'])
            return func.HttpResponse(
                json.dumps({'sorted_attempts': attempts}),
                status_code=200,
                mimetype='application/json',
                headers=CORS_HEADERS
            )
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
