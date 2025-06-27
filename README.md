# 🏆 Leaderboard App

A web application built with **Next.js**, **Sequelize**, and **SQLite** for managing and visualizing test suite sessions, user scores, and rankings. Features Swagger-powered API documentation and supports advanced pagination, charting, and session ranking logic.

---

## 📦 Requirements

- **Node.js**
- **Yarn** (or use `npm` if preferred)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
yarn install
```

### 2. Initialize the database 
```bash
yarn initdb
```

### 3. Build the project 
```bash
yarn build
```

### 4. Start the production environment 
```bash
yarn start
```

---

## 🗃️ Database Setup

This project uses **Sequelize** as the ORM and supports a SQLite database.
> 💡 Make sure your database connection string is configured in `lib/constants.js` or via environment variables before running `initdb`.

---


## 🧪 Development Workflow

### Start the Next.js Development Server  
**`yarn dev`**  
Runs the app in development mode at: http://localhost:3000

### Build for Production  
**`yarn build`**

### Start Production Server  
**`yarn start`**

---

## 📊 Features

- **Authentication**: Manage suite ownership with users, and authenticate access to the database.  
- **Test Suites & Sessions**: Organize and rank sessions within test suites using custom scoring logic.  
- **Pagination**: Continue-token based pagination with base64 encoding.  
- **Session Ranking**: Uses SQL window functions for efficient rank calculation.  
- **Data Visualization**: Integrated with `echarts` to visualize score progression over time.  
- **Hooks & Score Calculation**: Sequelize hooks recalculate total score when scores change.  
- **Swagger API Docs**: Available at `/docs` (http://localhost:3000/docs)

---

## 📑 Commands

* **`yarn dev`** - launches the development environment at http://localhost:3000
* **`yarn build`** - Builds the project for production
* **`yarn start`** - Starts the production server
* **`yarn initdb`** - Initializes an empty database with a default admin user (username: `admin`, password: `test123`)
* **`yarn testdb`** - Initializes a database with dummy test results for testing performance and functionality. 

---

## 📘 API Documentation

Auto-generated using **Swagger** (via `swagger-jsdoc` + `swagger-ui-express`).

Visit `/docs` while the app is running to view all available endpoints with schemas, parameters, and responses.

---

## 🔐 Authentication

This app uses **JWT-based authentication** with a `users` table in the database and **Next.js middleware** to protect API routes and pages.

### Users Table

The `users` table stores basic authentication data:

- `id`
- `username`
- `name`
- `email`
- `passwordHash` (hashed using bcrypt)

---

### 🔧 JWT Authentication

**Login flow:**

1. User submits credentials (`username` + `password`)
2. Server verifies the password (bcrypt)
3. A **JWT** is signed and returned
4. The client stores the JWT (typically in a cookie or localStorage)

**Token contains:**

```json
{
  "id": 123,
  "username": "alice",
  "name": "Alice Doe"
}
```

---

### 🛡 Middleware Protection

The app uses **Next.js Middleware** (`middleware.ts`) to protect private routes.

Example:

```js
import { NextResponse } from 'next/server';
import { verifyJwt } from './lib/auth';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;

  if (!token || !verifyJwt(token)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

Apply this middleware to secure routes by configuring the `matcher` field in `middleware.ts`.

---

## 🔍 Notable Endpoints

- **`GET /api/leaderboard/suites`**: Paginated list of test suites (by updated timestamp)  
- **`GET /api/leaderboard/suites/{id}/sessions`**: Fetches all sessions for a suite, with pagination  
- **`GET /api/leaderboard/suites/{id}/sessions/{sessionid}`**: Returns a session, its scores, rank, and suite stats  

---

## 🛠 Notes

- To improve Sequelize performance:
  - Use **bulk inserts** instead of per-record creation
  - Use **window functions** and `raw: true` for rank and aggregate queries
- For React performance:
  - Use `useMemo()` for heavy computations like ECharts options
  - Use `ReactEChartsCore` with pre-registered chart types

---

## 📁 Project Structure

```

/lib              → Helper functions (e.g. DB score calculation)  
/db/models        → Sequelize models & associations  
/styles           → SCSS stylesheets  
/pages            → Next.js routes and page components  
/pages/api        → RESTful API routes  
/docs             → Swagger UI setup
```

---

## 🧪 Testing (Optional Setup)

This project can be extended with unit tests via `Cypress` or `jest`. Currently, test setup is not included.