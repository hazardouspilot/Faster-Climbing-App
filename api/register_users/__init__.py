import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("Hello from register_users!", status_code=200)

# import logging
# import json
# import azure.functions as func
# # from shared.db import AzureSQLDB
# import hashlib
# import uuid
# import os

# allowed_origin = os.environ.get('ALLOWED_ORIGIN', '*')

# CORS_HEADERS = {
#     'Access-Control-Allow-Origin': allowed_origin,
#     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
#     'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Username'
# }

# # Database connection logic

# # import os
# import pyodbc
# from contextlib import contextmanager

# class AzureSQLDB:
#     def __init__(self):
#         self.connection_string = (
#             "DRIVER={ODBC Driver 18 for SQL Server};"
#             f"SERVER={os.environ['DB_HOST']};"
#             f"DATABASE={os.environ['DB_NAME']};"
#             f"UID={os.environ['DB_USER']};"
#             f"PWD={os.environ['DB_PASS']};"
#             "Encrypt=yes;"
#             "TrustServerCertificate=no;"
#             "Connection Timeout=30;"
#         )

#     @contextmanager
#     def get_connection(self):
#         connection = None
#         try:
#             connection = pyodbc.connect(self.connection_string)
#             yield connection
#         finally:
#             if connection:
#                 connection.close()

#     @contextmanager
#     def get_cursor(self):
#         with self.get_connection() as connection:
#             cursor = connection.cursor()
#             try:
#                 yield cursor
#             finally:
#                 cursor.close()

#     def execute(self, sql, params=()):
#         with self.get_cursor() as cursor:
#             cursor.execute(sql, params) if params else cursor.execute(sql)
#             cursor.connection.commit()
#             return cursor.rowcount

#     def fetch_all(self, sql, params=()):
#         with self.get_cursor() as cursor:
#             cursor.execute(sql, params) if params else cursor.execute(sql)
#             columns = [column[0] for column in cursor.description]
#             rows = cursor.fetchall()
#             return [dict(zip(columns, row)) for row in rows]

#     def fetch_generator(self, sql, params=()):
#         with self.get_cursor() as cursor:
#             cursor.execute(sql, params) if params else cursor.execute(sql)
#             for row in cursor:
#                 yield row

# def main(req: func.HttpRequest) -> func.HttpResponse:
#     logging.info("register_users function triggered. Method: %s", req.method)
#     db = AzureSQLDB()

#     if req.method == 'OPTIONS':
#         logging.info("OPTIONS request received. Returning CORS headers.")
#         # Preflight request
#         return func.HttpResponse(
#             "",
#             status_code=200,
#             headers=CORS_HEADERS
#         )
    
#     elif req.method == 'POST':        
#         try:
#             logging.info("Attempting to parse JSON body.")
#             # Get request body
#             req_body = req.get_json()
#             logging.info("Request body: %s", req_body)
            
#             # Extract user data
#             username = req_body.get('username')
#             password = req_body.get('password')
#             first_name = req_body.get('firstName', '')
#             last_name = req_body.get('lastName', '')
#             email = req_body.get('email', '')
#             logging.info("Parsed user data: username=%s, first_name=%s, last_name=%s, email=%s", username, first_name, last_name, email)
            
#             # Validate required fields
#             if not username or not password:
#                 logging.warning("Missing username or password.")
#                 return func.HttpResponse(
#                     json.dumps({"error": "Username and password are required"}),
#                     status_code=400,
#                     mimetype="application/json",
#                     headers=CORS_HEADERS
#                 )
            
#             # Check if username already exists
#             logging.info("Checking if username already exists.")
#             existing_user = db.fetch_all("SELECT Username FROM Climbers WHERE Username = ?", (username,))
#             if existing_user:
#                 logging.warning("Username already exists: %s", username)
#                 return func.HttpResponse(
#                     json.dumps({"error": "Username already exists"}),
#                     status_code=409,
#                     mimetype="application/json",
#                     headers=CORS_HEADERS
#                 )
            
#             # Hash the password with salt
#             logging.info("Hashing password and generating salt.")
#             salt = uuid.uuid4().hex
#             hashed_password = hashlib.sha256((password + salt).encode()).hexdigest()
#             password_with_salt = f"{salt}:{hashed_password}"
            
#             # Insert new user
#             logging.info("Inserting new user into database.")
#             db.execute(
#                 "INSERT INTO Climbers (Username, Pass, FirstName, LastName, Email, Access) VALUES (?, ?, ?, ?, ?, ?)",
#                 (username, password_with_salt, first_name, last_name, email, 'Regular')
#             )
            
#             logging.info("User registered successfully.")
#             return func.HttpResponse(
#                 json.dumps({"message": "User registered successfully"}),
#                 status_code=201,
#                 mimetype="application/json",
#                 headers=CORS_HEADERS
#             )
            
#         except Exception as e:
#             logging.error(f"Error registering user: {str(e)}", exc_info=True)
#             return func.HttpResponse(
#                 json.dumps({"error": str(e)}),
#                 status_code=500,
#                 mimetype="application/json",
#                 headers=CORS_HEADERS
#             )
    
#     else:
#         return func.HttpResponse(
#             json.dumps({"error": "Method not allowed"}),
#             status_code=405,
#             mimetype="application/json",
#             headers=CORS_HEADERS
#         )