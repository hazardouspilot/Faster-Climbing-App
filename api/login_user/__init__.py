import logging
import json
import azure.functions as func
from shared.db import AzureSQLDB
import hashlib
# from shared.cors_middleware import CorsMiddleware

CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

def main(req: func.HttpRequest) -> func.HttpResponse:
    db = AzureSQLDB()

    if req.method == 'OPTIONS':
        # Preflight request
        return func.HttpResponse(
            "",
            status_code=204,
            headers=CORS_HEADERS
        )
    
    try:
        # Get request body
        req_body = req.get_json()
        
        # Extract login credentials
        username = req_body.get('username')
        password = req_body.get('password')
        
        # Validate required fields
        if not username or not password:
            return func.HttpResponse(
                json.dumps({"error": "Username and password are required"}),
                status_code=400,
                mimetype="application/json",
                headers=CORS_HEADERS
            )
        
        # Fetch user from database
        user_data = db.fetch_all("SELECT Username, Pass, FirstName, LastName, Email, Access FROM Climbers WHERE Username = ?", (username,))
        
        if not user_data:
            return func.HttpResponse(
                json.dumps({"error": "Invalid username"}),
                status_code=401,
                mimetype="application/json",
                headers=CORS_HEADERS
            )
        
        # Verify password
        stored_password = user_data[0][1]
        salt = stored_password.split(':')[0]
        stored_hash = stored_password.split(':')[1]
        
        # Hash the input password with the same salt
        input_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        
        if input_hash != stored_hash:
            return func.HttpResponse(
                json.dumps({"error": "Invalid password"}),
                status_code=401,
                mimetype="application/json",
                headers=CORS_HEADERS
            )
        
        # Create user session data (without sensitive info)
        user_session = {
            "username": user_data[0][0],
            "firstName": user_data[0][2],
            "lastName": user_data[0][3],
            "email": user_data[0][4],
            "access": user_data[0][5]
        }

        return func.HttpResponse(
            json.dumps({"message": "Login successful", "user": user_session}),
            status_code=200,
            mimetype="application/json",
            headers=CORS_HEADERS
        )
        
    except Exception as e:
        logging.error(f"Error during login: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json",
            headers=CORS_HEADERS
        )