# Database connection logic

import os
import logging

try:
    import pyodbc
    logging.info("Successfully imported pyodbc")
except ImportError as e:
    logging.error(f"pyodbc import failed: {e}")
    raise

from contextlib import contextmanager

class AzureSQLDB:
    def __init__(self):
        self.connection_string = (
            "DRIVER={ODBC Driver 18 for SQL Server};"
            f"SERVER={os.environ['DB_HOST']};"
            f"DATABASE={os.environ['DB_NAME']};"
            f"UID={os.environ['DB_USER']};"
            f"PWD={os.environ['DB_PASS']};"
            "Encrypt=yes;"
            "TrustServerCertificate=no;"
            "Connection Timeout=30;"
        )

    @contextmanager
    def get_connection(self):
        connection = None
        try:
            connection = pyodbc.connect(self.connection_string)
            yield connection
        finally:
            if connection:
                connection.close()

    @contextmanager
    def get_cursor(self):
        with self.get_connection() as connection:
            cursor = connection.cursor()
            try:
                yield cursor
            finally:
                cursor.close()

    def execute(self, sql, params=()):
        with self.get_cursor() as cursor:
            cursor.execute(sql, params) if params else cursor.execute(sql)
            cursor.connection.commit()
            return cursor.rowcount

    def fetch_all(self, sql, params=()):
        with self.get_cursor() as cursor:
            cursor.execute(sql, params) if params else cursor.execute(sql)
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]

    def fetch_generator(self, sql, params=()):
        with self.get_cursor() as cursor:
            cursor.execute(sql, params) if params else cursor.execute(sql)
            for row in cursor:
                yield row
