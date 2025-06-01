# login_user/__init__.py

import logging
import json
import azure.functions as func
import pymssql
# import pyodbc

try:
    # from shared.db_pyodbc import AzureSQLDB
    from shared.db_pymssql import AzureSQLDB
    logging.info("Shared module loaded")

except Exception as e:
    logging.error(f"Failed to import AzureSQLDB: {e}")

import hashlib
import os

allowed_origin = os.environ.get('ALLOWED_ORIGIN', '*')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': allowed_origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Username'
}

def main(req: func.HttpRequest) -> func.HttpResponse:

    logging.info('Python HTTP trigger function processed a request.')
    logging.info(f"Request method: {req.method}")
    logging.info(f"Request body: {req.get_body()}")

    try:
        db = AzureSQLDB()
        logging.info("Database connection object created successfully")
    except Exception as db_err:
        logging.error(f"Failed to initialize DB: {db_err}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"error": "Internal server error while initializing DB."}),
            status_code=500,
            mimetype="application/json",
            headers=CORS_HEADERS
        )

    logging.info("Database connection established")
 
    if req.method == 'OPTIONS':
        # Preflight request
        logging.info("CORS preflight request")
        return func.HttpResponse(
            "",
            status_code=200,
            headers=CORS_HEADERS
        )
    
    elif req.method == 'POST':
        logging.info("Processing POST request for user login")
        try:
            # Get request body
            req_body = req.get_json()
            
            # Extract login credentials
            username = req_body.get('username')
            password = req_body.get('password')
            
            logging.info(f"Read Username from API call: {username}")

            # Validate required fields
            if not username or not password:
                return func.HttpResponse(
                    json.dumps({"error": "Username and password are required"}),
                    status_code=400,
                    mimetype="application/json",
                    headers=CORS_HEADERS
                )
            
            logging.info("Username and password provided, proceeding with authentication")

            # Fetch user from database
            user_data = db.fetch_all(
                "SELECT Username, Pass, FirstName, LastName, Email, Access FROM Climbers WHERE Username = %s", (username,)
                )
            # user_data = db.fetch_all("SELECT Username, Pass, FirstName, LastName, Email, Access FROM Climbers WHERE Username = ?", (username,))
            
            if user_data:
                logging.info(f"Fetched user data from database: {user_data[0]}")  # entire row
                # Or a specific field, e.g. the email:
                # logging.info(f"User email: {user_data[0][4]}")
            else:
                logging.info("No user found")
                return func.HttpResponse(
                    json.dumps({"error": "Invalid username"}),
                    status_code=401,
                    mimetype="application/json",
                    headers=CORS_HEADERS
                )                
            
            # Verify password
            stored_password = user_data[0]['Pass']
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
                "username": user_data[0]['Username'],
                "firstName": user_data[0]['FirstName'],
                "lastName": user_data[0]['LastName'],
                "email": user_data[0]['Email'],
                "access": user_data[0]['Access']
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
    else:
        return func.HttpResponse(
            json.dumps({"error": "Method not allowed"}),
            status_code=405,
            mimetype="application/json",
            headers=CORS_HEADERS
        )