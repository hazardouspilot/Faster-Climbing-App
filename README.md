# Faster-Climbing-App

First iteration of climbing app used Flask BE + Jinja FE hosted on AWS EC2 server, communicating with Azure SQL database. Good learner project but issues were: queries and submissions in app were too slow, page reloads were slow and provided poor UX, use of 24/7 ec2 server exhausted AWS free tier resources.

New app proposed to resolve these issues and future proof the app + get more familiar with Azure:

React FE - faster UX with no page reloads
Azure Functions BE - Serverless for lower resource consumption, recycling python code
Azure SQL - retain existing database
Azure Static Web Apps - simpler deployment

To activate venv:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\ReactApp\Scripts\Activate

Current state:
-front end is working, can navigate between login and register pages
-backend is working, can call API using Postman and user is added to SQL database
-frontend can successfully call APIs with CORS
--allowed OPTIONS and GET methods in function.json for both login and register APIs
--Added CORS headers to all function returns
--changed local.settings.json back to original contents
