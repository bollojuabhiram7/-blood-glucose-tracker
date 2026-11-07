# Sweety – Blood Glucose Tracker

A full-stack web application designed to help users record, monitor, and understand their daily blood glucose levels through a simple and intuitive dashboard.

## Overview

Sweety is a blood glucose tracking application that allows users to securely manage their glucose readings, review historical records, and monitor their progress. It provides an organized way to maintain daily health records.

## Features

- **User Authentication:** Secure user registration and login using JWT authentication.
- **Glucose Tracking:** Add, edit, and delete blood glucose readings.
- **Daily Tracking:** Record readings across four daily time slots:
  - Morning
  - After Breakfast
  - After Lunch
  - After Dinner
- **Dashboard:** View and manage glucose readings in one place.
- **History and Reports:** Review previously recorded readings and monitor trends.
- **Input Validation:** Validate user inputs before saving records.
- **Database Integration:** Store user accounts and glucose readings in PostgreSQL.
- **Demo Account:** Explore the application using sample data.
- **Docker Support:** Run the frontend, backend, and database using Docker Compose.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcryptjs |
| API Communication | Axios |
| Data Visualization | Recharts |
| Containerization | Docker, Docker Compose |

## Project Structure

```text
sweety-blood-glucose-tracker/
│
├── client/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── assets/
│       └── pages/
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── server.js
│
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Docker Desktop
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/bollojuabhiram7/-blood-glucose-tracker.git
cd -blood-glucose-tracker
```

### 2. Configure Environment Variables

Create a `.env` file in the project root.

Configure the variables required by `docker-compose.yml`:

```env
POSTGRES_USER=your_database_user
POSTGRES_PASSWORD=your_strong_database_password
POSTGRES_DB=sweety_db
JWT_SECRET=your_long_random_secret
```

Use your own secure credentials. Never commit `.env` files to GitHub.

### 3. Start the Application

Run the following command from the project root:

```bash
docker compose up -d --build
```

Docker Compose will start the PostgreSQL database, backend API, and frontend application.

### 4. Access the Application

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:5000 |
| PostgreSQL | Internal Docker network |

### 5. Stop the Application

```bash
docker compose down
```

To stop the application and remove the database volume as well:

```bash
docker compose down -v
```

**Warning:** The `-v` command deletes the Docker database volume and its stored data.

## Demo Account

You can explore the application using the seeded demo account:

| Field | Value |
|---|---|
| Email | demo@sweety.local |
| Password | SweetyDemo123! |

The demo account contains sample glucose readings for demonstration purposes.

## Database and Migrations

Sweety uses Prisma ORM with PostgreSQL.

Apply database migrations:

```bash
cd server
npx prisma migrate deploy
```

Generate the Prisma client:

```bash
npx prisma generate
```

Seed the database with demo data:

```bash
npm run db:seed
```

For Docker-based setup, run the seed command using:

```bash
docker compose exec backend npm run db:seed
```

## Security

- JWT-based authentication.
- Password hashing with bcryptjs.
- Protected API routes.
- User-specific glucose records.
- Environment variables for sensitive configuration.
- Docker-based application deployment.

## Future Enhancements

- Advanced glucose analytics and trend visualization.
- Customizable glucose targets.
- Exportable health reports.
- Improved mobile responsiveness.
- Notifications and reminders.

## Author

**Abhiram Bolloju**

- GitHub: [@bollojuabhiram7](https://github.com/bollojuabhiram7)

---

*Sweety – Making daily blood glucose tracking simpler and more organized.*