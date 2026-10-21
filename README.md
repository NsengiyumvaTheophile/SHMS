# Student Hostel Management System (SHMS)

Web application for **RP Musanze College** to manage student hostel accommodation, room allocation, fees, manually verified payments, maintenance, occupancy, and reports.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express.js, JWT, bcrypt |
| Database | Prisma ORM + SQLite (local). MySQL-ready schema notes included |
| Tools | VS Code, Git / GitHub |

Local development uses **SQLite**, so you do not need MySQL installed. The schema matches the same entities defined in the SRS. For production MySQL, change the Prisma datasource provider to `mysql` and set `DATABASE_URL` accordingly.

## Features

- Role-based access: System Admin, Hostel Admin, Student
- Public campus home page with hostel occupancy, admin contact, and quick links
- Student, hostel, and room management (add / edit / delete rooms; capacity-based, no beds)
- Student hostel requests: choose hostel and optional room, track Pending → Approved / Rejected / Cancelled
- Admin review, then allocate the selected student to an available room (or move them later)
- Check-in / check-out and occupancy recalculation
- Hostel fees, outstanding balances, manual payment recording (no gateway, no proof upload)
- Maintenance requests
- Admin and student dashboards
- Reports with CSV export
- Audit logs, campus contact settings, database backup and restore

## Requirements

1. **Node.js 18 or newer** (includes npm). Check with:

```bash
node -v
npm -v
```

2. A code editor such as **VS Code** or **Cursor**.
3. Two terminal windows (backend and frontend run separately).

## How to run (step by step)

Do these steps from the project root folder `SHMS`.

### Step 1 — Open the project

```bash
cd path/to/SHMS
```

On this machine the folder is typically:

```bash
cd C:\Users\user\Downloads\SHMS
```

### Step 2 — Install dependencies

From the project root:

```bash
npm run install:all
```

Or install each app yourself:

```bash
cd backend
npm install
cd ../frontend
npm install
```

### Step 3 — Configure the backend environment

The backend already includes a `.env` file for local SQLite. If it is missing, copy the example:

```bash
cd backend
copy .env.example .env
```

On macOS / Linux:

```bash
cp .env.example .env
```

Required values:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change_this_secret"
JWT_EXPIRES_IN="8h"
PORT=5000
BACKUP_DIR="./backups"
```

### Step 4 — Create the database and demo data

Still in `backend`:

```bash
npm run db:setup
```

This generates the Prisma client, creates `prisma/dev.db`, and seeds demo users, hostels, rooms, fees, and sample requests.

> `db:setup` **resets seeded data**. Only run it when you want a clean demo database.

### Step 5 — Start the API (Terminal 1)

From `backend`:

```bash
npm run dev
```

Wait until you see:

```
SHMS API running on http://localhost:5000
```

Health check: http://localhost:5000/api/health

Leave this terminal open.

### Step 6 — Start the website (Terminal 2)

Open a **second** terminal:

```bash
cd C:\Users\user\Downloads\SHMS\frontend
npm run dev
```

Wait until Vite prints a local URL, usually:

```
http://localhost:5173
```

The frontend proxies `/api` to the backend on port 5000, so both must be running.

### Step 7 — Open the app

1. Browser: http://localhost:5173
2. You should see the RP Musanze College home page (hostels, contact, footer links).
3. Click **Staff / Student login**.

### Step 8 — Sign in with a demo account

Password for **all** demo accounts: `Password123!`

| Role | Username | What to try first |
|------|----------|-------------------|
| System Administrator | `sysadmin` | Users, System settings, backup |
| Hostel Administrator | `hosteladmin` | Requests → Allocations → Rooms |
| Student | `student1` | Dashboard, fees (already has a payment) |
| Student | `student2` | Hostel request (pending demo request) |
| Student | `student3` | Approved request waiting for a room |

Typical student flow:

1. Log in as `student3` or a student with no active request.
2. Open **Hostel Request**, choose a hostel/room, submit.
3. Log out, log in as `hosteladmin`.
4. Open **Requests**, approve or reject.
5. Open **Allocations**, select the student, then select an available room.

Typical admin room flow:

1. **Rooms** → add a room (hostel, number, capacity).
2. Delete a room only if nobody is assigned and it has no allocation history (otherwise set it **INACTIVE**).

## Run commands from the project root

```bash
npm run install:all
npm run setup
npm run dev:backend
npm run dev:frontend
```

`setup` is the same as `npm run db:setup` in `backend`.

## Demo Accounts

Password for all: `Password123!`

| Role | Username |
|------|----------|
| System Administrator | `sysadmin` |
| Hostel Administrator | `hosteladmin` |
| Student | `student1`, `student2`, `student3` |

## Business Rules Enforced

- Available Spaces = Room Capacity − Assigned Students
- Outstanding Balance = Total Hostel Fee − Total Amount Paid
- Only approved requests can be allocated
- Duplicate active requests (Pending or Approved) are blocked
- Students with an active room cannot submit another request
- No online payments and no payment-proof uploads
- Students only see their own records

## If something does not start

| Problem | What to do |
|---------|------------|
| `npm` is not recognized | Install Node.js 18+ and reopen the terminal |
| Port 5000 already in use | Stop the other process, or change `PORT` in `backend/.env` |
| Port 5173 already in use | Vite will offer the next port; keep using the URL it prints |
| Frontend loads but login fails | Start the backend first (`npm run dev` in `backend`) |
| Database errors after pulling new code | From `backend` run `npx prisma generate` then `npx prisma db push` |
| Want a clean demo again | From `backend` run `npm run db:setup` (this replaces demo data) |

## Project Structure

```
SHMS/
  backend/                 Express API + Prisma + SQLite
    prisma/                schema, seed, local database
    src/                   routes and controllers
    .env                   local database and JWT settings
  frontend/                React SPA
    public/images/         Campus and hostel photos for the home page
    src/pages/             Admin, student, and public pages
  Description_of_Technologies_SHMS.md
  README.md
```
