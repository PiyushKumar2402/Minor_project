## Submitted By

**Piyush Kumar** — 25MCC20061 — MCA (3rd Semester)

**Mentor:** Shah Dhruv Samir (E19145)

---
# Online Doctor Appointment & Patient Queue Management System

A full-stack system for booking doctor appointments (online/in-person), automatic
time-slot generation, patient queue management, and Gmail-based confirmations,
built with role-based dashboards for Patients, Doctors, and Admins.

## Tech Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth
- **Frontend:** React (Vite)
- **Integrations:** Gmail (Nodemailer), Zoom API

## Project Structure
```
doctor-appointment-system/
├── backend/          # Express API
│   └── src/
│       ├── config/       # DB connection, env setup
│       ├── models/       # Mongoose schemas
│       ├── routes/       # API route definitions
│       ├── controllers/  # Route handlers / business logic
│       └── middleware/   # Auth, error handling, etc.
└── frontend/         # React app
    └── src/
        ├── pages/        # Route-level views
        ├── components/   # Reusable UI components
        ├── api/          # API client functions
        └── context/       # Auth/global state
```

## Development Roadmap (staged for incremental commits)
- [x] **Stage 1** — Project scaffolding
- [x] **Stage 2** — Authentication & user management
- [ ] **Stage 3** — Doctor management (admin)
- [ ] **Stage 4** — Doctor availability & automatic slot generation
- [ ] **Stage 5** — Appointment booking core
- [ ] **Stage 6** — Online/in-person consultation modes + Zoom integration
- [ ] **Stage 7** — Gmail notification system
- [ ] **Stage 8** — Patient queue management
- [ ] **Stage 9** — Doctor dashboard
- [ ] **Stage 10** — Admin dashboard
- [ ] **Stage 11** — Reminders & polish
- [ ] **Stage 12** — Deployment

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your Mongo URI, JWT secret, etc.
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
