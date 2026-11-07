SWEETY DOCKER COMPOSE SETUP

Copy these files into your existing project:
- docker-compose.yml -> project root
- server/Dockerfile -> server/Dockerfile
- server/.dockerignore -> server/.dockerignore
- client/Dockerfile -> client/Dockerfile
- client/nginx.conf -> client/nginx.conf
- client/.dockerignore -> client/.dockerignore

Keep your existing server/.env for normal local development. Docker Compose uses the root-level environment variables or the safe local defaults shown below; it does not read server/.env automatically.

Optional: create a project-root .env file (do not commit it):
POSTGRES_PASSWORD=choose_a_local_database_password
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
APP_TIME_ZONE=Asia/Kolkata

Run from the project root:
  docker compose up --build

Open:
  Frontend: http://localhost:5173
  Backend health: http://localhost:5000

The API currently uses http://localhost:5000/api in client/src/api/axios.js, so the published ports preserve that URL. The app's existing CORS configuration also allows http://localhost:5173.

Stop containers:
  docker compose down

Stop and DELETE the PostgreSQL data volume (destructive; removes database data):
  docker compose down -v

Important:
- Docker Compose starts PostgreSQL, runs `prisma migrate deploy`, starts the API, and serves the built React app through Nginx.
- Existing migration files under server/prisma/migrations must be committed and present.
- Do not copy your real server/.env into the image or commit secrets.
- The default passwords are for local evaluation only. Set your own root .env values before sharing or deploying.
- This does not automatically seed demo data. To seed inside the running API container after startup, run:
  docker compose exec server node prisma/seed.js
