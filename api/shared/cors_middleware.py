class CorsMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, req, context):
        # Add CORS headers to all responses
        headers = {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true'
        }

        # Handle OPTIONS requests specifically
        if req.method.lower() == 'options':
            return context.res(status_code=200, headers=headers)

        # For all other requests, let the function handle it but add CORS headers
        response = await self.app(req, context)
        
        # Add CORS headers to the response
        for key, value in headers.items():
            response.headers[key] = value
            
        return response