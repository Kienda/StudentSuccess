# StudentSuccess (Web App) — Academic Guidance & Recommendations Platform

StudentSuccess is a full-stack web application that helps students stay organized, track academic progress, and receive tailored recommendations and guidance based on their profile (major, academic status, GPA). It includes authentication, role-based access (admin vs. student), and CRUD functionality backed by PostgreSQL.

This project is the **web version** of my College Navigator concept, built to support end-to-end workflows with a real database and server-side rendering.

---

## Demo / Screens
> Add screenshots or a short GIF here (optional)

---

## Problem
Many college students struggle to:
- Find relevant resources (scholarships, tutoring, campus opportunities)
- Stay on track academically and plan milestones
- Get guidance specific to their major, standing, and goals

---

## Solution
StudentSuccess provides:
- **Student dashboards** with personalized guidance & recommendations  
- **Admin tools** to manage student records and content  
- A structured workflow for student profile creation, login, and progress support

---

## Key Features
### Student Features
- Login and personalized dashboard
- Guidance content filtered by **major**, **status level**, and **GPA range**
- Recommendations filtered by major
- View curated support resources and next steps

### Admin Features (Role-Based)
- Admin-only dashboard
- Manage students list (view, edit, delete)
- Manage guidance items and recommendation content (via routes/views)

### System Features
- Server-side rendering with Handlebars
- Secure password hashing with bcrypt
- Session-based authentication + JWT cookie check (auth middleware)
- REST-style CRUD routes
- PostgreSQL database connection via `pg`

---

## Tech Stack
**Backend**
- Node.js, Express.js
- PostgreSQL (pg)
- express-session
- JWT + cookie-parser
- bcrypt
- method-override (PUT/DELETE from forms)

**Frontend**
- Handlebars (express-handlebars)
- HTML/CSS (public folder)

---

## Project Structure (Typical)
StudentSuccess/
├─ app.js
├─ routes/
│ ├─ recommendations.js
│ └─ guidance.js
├─ views/
│ ├─ layouts/
│ ├─ partials/
│ ├─ home.hbs
│ ├─ login.hbs
│ ├─ dashboard.hbs
│ ├─ students.hbs
│ ├─ edit-student.hbs
│ └─ ...
├─ public/
├─ .env
└─ package.json

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL installed locally OR hosted Postgres (Render / Supabase / Neon)
- npm

---

## Installation

### 1) Clone the repository
bash
git clone https://github.com/Kienda/StudentSuccess.git
cd StudentSuccess
2) Install dependencies
bash
Copy code
npm install
3) Configure environment variables
Create a .env file in the root directory:

env

DB_USER=your_postgres_user
DB_HOST=localhost
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432

SESSION_SECRET=your_session_secret
SERVER_SECRET=your_jwt_secret
Note: DB_PASSWORD is read as a string in the project.

Database Setup
Create tables (example)
You can adapt this schema to match your project. Minimum required fields based on the app:

students
id (PK)

name

email (unique)

student_id

major

status

gpa

semester

password

role (admin/student)

created_at

guidance
id (PK)

major (or All)

status_level (or All)

min_gpa

max_gpa

title

content

recommendations
id (PK)

major

title

description

link (optional)

Run the App
Start the server:


node app.js
The application runs on:

arduino
Copy code
http://localhost:1800
Core Routes (High Level)
/ — Home page

/login — Login (GET + POST)

/dashboard — Student dashboard (requires session)

/students — Student list (admin only)

/students/new — Add new student form

/students/:id/edit — Edit student form

DELETE /students/:id — Delete student

/recommendations — Recommendations routes (separate router)

/guidance — Guidance routes (separate router)

/admin — Admin dashboard (admin only)

/logout — End session

Authentication Notes
Passwords are hashed using bcrypt

The app uses:

express-session for logged-in sessions

JWT verification via cookie (requireAuth) for protected creation routes

Admin access is enforced via requireAdmin

What I Built / My Contribution
Designed the full-stack architecture (Express + Handlebars + Postgres)

Implemented authentication and role-based access control

Built CRUD features for student management

Built filtering logic to generate personalized dashboards based on student profile fields

Integrated database queries and server-rendered UI pages

Future Improvements
Improve JWT/session consistency (use one unified auth strategy)

Add registration flow + email verification

Add user-friendly admin UI for creating guidance/recommendations

Deploy the app (Render/Vercel + hosted Postgres)

Add automated tests and CI

License
MIT License
