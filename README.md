# Faster-Climbing-App

First iteration of climbing app used Flask BE + Jinja FE hosted on AWS EC2 server, communicating with Azure SQL database. Good learner project but issues were: queries and submissions in app were too slow, page reloads were slow and provided poor UX, use of 24/7 ec2 server exhausted AWS free tier resources.

New app proposed to resolve these issues and future proof the app + get more familiar with Azure:

React FE - faster UX with no page reloads
Azure Functions BE - Serverless for lower resource consumption, recycling python code
Azure SQL - retain existing database
Azure Static Web Apps - simpler deployment

Current state:
-front end is working, deployed using github workflow and azure static web apps via main branch
-backend is working, but is on separate branch (isolated-backend-deployment) and deployed to azure functions separately using azure extension
-3rd branch (unified-dev) has unified codebase for development with windsurf
