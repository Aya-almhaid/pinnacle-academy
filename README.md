# Pinnacle Academy

A full-stack academy/LMS-lite platform with three roles — Student, Instructor, and Admin — built with React and Express. Built as a reusable base that can be rebranded and customized for a specific academy client.

## Tech Stack

- **Frontend:** React 19, Vite, React Router v7, Axios
- **Backend:** Node.js, Express 5, JWT authentication, bcryptjs
- **Database:** SQLite (via better-sqlite3)

## Features

- Public course catalog with category filtering and course detail pages
- Student registration/login, course enrollment, and an enrolled-courses dashboard
- Instructor dashboard showing assigned courses and enrolled student rosters
- Admin dashboard to create/edit/delete courses, assign instructors, and manage user roles

## Demo Accounts (seeded on first run)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pinnacle.academy | admin123 |
| Instructor | sarah@pinnacle.academy | instructor123 |
| Instructor | james@pinnacle.academy | instructor123 |

Register a new account to try the student flow.

## Local Setup

```bash
cd server
npm install
echo "JWT_SECRET=your_secret_here" > .env
npm start
```

```bash
cd client
npm install
npm run dev
```

Backend runs on port 5005, frontend on Vite's default dev port.
