# Equinox

A habit and workout tracker with a brutalist/terminal design. Track daily habits with streaks, log workouts, and monitor calisthenics progressions.

**[Portfolio](https://jimmmy-portfolio.vercel.app)**

---

## Features

- **Dashboard** — Real-time stats: current streak, record streak, daily completion, weekly workouts
- **Habit Tracking** — Create color-coded habits, toggle daily completion, streak tracking, calendar view
- **Workout Logging** — Support for musculation (weight-based) and calisthenics (bodyweight progressions)
- **Progress Tracking** — PR tracking, volume method (3x3 → 5x5), unilateral exercise support
- **Multi-User** — Registration with admin approval workflow, JWT authentication
- **Admin Panel** — Approve or reject pending user accounts

## Screenshots

> Screenshots coming soon

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite 7, Lucide React |
| Backend | Vercel Serverless Functions |
| Database | PostgreSQL (Neon), Drizzle ORM |
| Auth | JWT (jose), bcryptjs |
| Storage | Vercel Blob |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) recommended)

### Installation

```bash
git clone https://github.com/jimmy-ngome/Equinox.git
cd Equinox
npm install
```

### Environment Variables

Create a `.env.local` file:

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-secret-key
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
```

### Database Setup

```bash
npm run db:generate
npm run db:migrate
```

### Run

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
├── api/
│   ├── auth/           # Register, login, logout
│   ├── admin/          # User approval
│   ├── habits/         # Habit CRUD & completions
│   ├── exercises/      # Exercise CRUD & logs
│   ├── sessions/       # Workout sessions
│   └── _auth.js        # JWT & bcrypt utilities
├── db/
│   ├── schema.js       # Drizzle schema
│   └── migrations/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── HabitTracker.jsx
│   │   ├── WorkoutTracker.jsx
│   │   ├── CalisthenicsProgress.jsx
│   │   ├── AuthScreen.jsx
│   │   └── AdminPanel.jsx
│   └── App.jsx
└── vercel.json
```

## Design

- **Font**: IBM Plex Mono
- **Theme**: Pure black (#000) background, white text, monospace typography
- **Style**: Brutalist/terminal aesthetic — sharp borders, high contrast, no gradients

## License

MIT
