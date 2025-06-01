# shared/db.py

import os
import logging

try:
    import pymssql
    logging.info("Successfully imported pymssql")
except Exception as e:
    logging.error(f"pymssql import failed: {e}")

from contextlib import contextmanager

class AzureSQLDB:
    def __init__(self):
        # Read connection info from environment variables
        self.server   = os.getenv("DB_HOST")
        self.database = os.getenv("DB_NAME")
        self.user     = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASS")

        # Optionally, if you need a custom port:
        # self.port = int(os.getenv("DB_PORT", "1433"))

        if not all([self.server, self.database, self.user, self.password]):
            missing = [k for k in ("DB_HOST", "DB_NAME", "DB_USER", "DB_PASS") if not os.getenv(k)]
            raise RuntimeError(f"Missing required environment variable(s): {', '.join(missing)}")

    @contextmanager
    def get_connection(self):
        """
        Context manager that yields a pymssql connection.
        Automatically closes when done.
        """
        conn = None
        try:
            # If you need to specify a port other than 1433, add port=self.port
            conn = pymssql.connect(
                server=self.server,
                user=self.user,
                password=self.password,
                database=self.database,
                # port=self.port  # uncomment if you use a non-default port
            )
            yield conn
        except Exception as e:
            logging.error(f"Error opening pymssql connection: {e}")
            raise
        finally:
            if conn:
                conn.close()

    @contextmanager
    def get_cursor(self):
        """
        Context manager that yields a cursor (as a dict cursor).
        Commits on execute() and closes automatically.
        """
        with self.get_connection() as conn:
            # as_dict=True makes each row returned as a Python dict
            cursor = conn.cursor(as_dict=True)
            try:
                yield cursor
                # If you want auto-commit behavior after each statement,
                # you could do conn.commit() here, but for fetches it isn't needed.
            except Exception as e:
                logging.error(f"Cursor operation failed: {e}")
                conn.rollback()
                raise
            finally:
                cursor.close()

    def execute(self, sql, params=()):
        """
        Executes INSERT/UPDATE/DELETE (or any non‐SELECT SQL). Returns rowcount.
        """
        with self.get_cursor() as cursor:
            try:
                if params:
                    cursor.execute(sql, params)
                else:
                    cursor.execute(sql)
                # Commit after the DML operation
                cursor.connection.commit()
                return cursor.rowcount
            except Exception as e:
                logging.error(f"Failed to execute SQL: '{sql}' with params {params}. Error: {e}")
                raise

    def fetch_all(self, sql, params=()):
        """
        Executes a SELECT and returns a list of dicts, one per row.
        Each dict maps column names to values.
        """
        with self.get_cursor() as cursor:
            try:
                if params:
                    cursor.execute(sql, params)
                else:
                    cursor.execute(sql)
                rows = cursor.fetchall()  # because as_dict=True, each row is already a dict
                return rows
            except Exception as e:
                logging.error(f"Failed to fetch all for SQL: '{sql}' with params {params}. Error: {e}")
                raise

    def fetch_generator(self, sql, params=()):
        """
        Executes a SELECT and yields one row dict at a time.
        """
        with self.get_cursor() as cursor:
            try:
                if params:
                    cursor.execute(sql, params)
                else:
                    cursor.execute(sql)
                for row in cursor:
                    yield row
            except Exception as e:
                logging.error(f"Failed to fetch generator for SQL: '{sql}' with params {params}. Error: {e}")
                raise