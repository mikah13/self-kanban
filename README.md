# Self Kanban

A simple personal kanban board app with a Hono backend and React frontend.

## Structure

```
app/   - Backend API (Hono + SQLite + Drizzle)
web/   - Frontend (React + TanStack Router + Tailwind)
```

## Quick Start

### Backend
```bash
cd app
npm install
npm run dev
```
API runs on http://localhost:3001

### Frontend
```bash
cd web
npm install
npm run dev
```
App runs on http://localhost:5173

## Tech Stack

- **Backend**: Hono, Drizzle ORM, SQLite
- **Frontend**: React, TanStack Router, Tailwind CSS

## Testing

```bash
cd app
npm test           # Run tests
npm run test:watch # Watch mode
npm run test:ui    # UI mode
```
