# LockedIn

**LockedIn** is a full-stack team performance & management platform — task boards, time tracking, performance scorecards with gamified badges, leave & permission requests, grievances, an org chart, team chat, and a company newsletter, all in one app.

## Tech stack

- **Backend:** NestJS + Prisma (SQLite for local dev)
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Realtime:** Socket.IO (chat)
- **Auth:** JWT-based

## Features

- **Dashboard** — personal snapshot of tasks, approvals, leave, and team standing
- **Tasks** — drag-and-drop kanban board with subtasks, skills, and approvals
- **Time Tracker** — start/stop timers logged against tasks
- **My Performance / Team Performance** — scored on time efficiency, task weight, and deadlines, with skill breakdowns and earned badges
- **Leave & Permissions** — request leave or short permission hours, with balances and an approval queue for leads/HR
- **Grievances** — submit and track grievances through resolution
- **Org Chart** — visual reporting structure
- **Chat** — channels and direct messages in real time
- **Newsletter** — pinned company announcements
- **Admin Console** — manage departments, teams, leave types, skills, and scoring rules

## Project structure

LockedIn/
├── apps/
│ ├── api/ # NestJS backend (Prisma + SQLite)
│ └── web/ # Next.js frontend
└── README.md


## Getting started

### Prerequisites

- Node.js 18+
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` and set a real `JWT_SECRET`.

### 3. Set up the database

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ../..
```

### 4. Run the app

In one terminal:

```bash
cd apps/api
npm run start:dev
```

In another terminal:

```bash
cd apps/web
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)

### Demo accounts

All seeded demo accounts use the password `password123` — pick any name from the login screen's demo account list.

## License

MIT
