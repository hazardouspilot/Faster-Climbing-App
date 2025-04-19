import logging
import json
import azure.functions as func
from shared.db import AzureSQLDB
import hashlib
import uuid
import time
# from shared.cors_middleware import CorsMiddleware

def main(req: func.HttpRequest) -> func.HttpResponse:
    db = AzureSQLDB()
    
    try:
        # Get request body
        req_body = req.get_json()
        
        # Extract user data
        username = req_body.get('username')
        password = req_body.get('password')
        first_name = req_body.get('firstName', '')
        last_name = req_body.get('lastName', '')
        email = req_body.get('email', '')
        
        # Validate required fields
        if not username or not password:
            return func.HttpResponse(
                json.dumps({"error": "Username and password are required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Check if username already exists
        existing_user = db.fetch_all("SELECT Username FROM Climbers WHERE Username = ?", (username,))
        if existing_user:
            return func.HttpResponse(
                json.dumps({"error": "Username already exists"}),
                status_code=409,
                mimetype="application/json"
            )
        
        # Hash the password with salt
        salt = uuid.uuid4().hex
        hashed_password = hashlib.sha256((password + salt).encode()).hexdigest()
        password_with_salt = f"{salt}:{hashed_password}"
        
        # Insert new user
        db.execute(
            "INSERT INTO Climbers (Username, Pass, FirstName, LastName, Email, Access) VALUES (?, ?, ?, ?, ?, ?)",
            (username, password_with_salt, first_name, last_name, email, 'Regular')
        )

        # headers = {
        # 'Access-Control-Allow-Origin': 'http://localhost:3000',
        # 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        # 'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        # }
        
        return func.HttpResponse(
            json.dumps({"message": "User registered successfully"}),
            status_code=201,
            mimetype="application/json"
            # headers=headers
        )
        
    except Exception as e:
        logging.error(f"Error registering user: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )