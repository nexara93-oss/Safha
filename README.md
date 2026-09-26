# Safha — School Management Platform

# URL : https://opulent-funicular-r74x74qp5pwrfpvgw-3000.app.github.dev

A complete SaaS School Management application (formerly "EduWave") for Moroccan private schools, replacing paper-based systems with digital attendance, grades, behavior tracking, and communication.

## Features
- Multi-role auth (Director, Teacher, Student, Admin)
- Trilingual (AR/FR/EN) with RTL support
- Light/Dark mode
- PDF bulk student import
- Real-time messaging
- Auto-generated teacher credentials
- Subscription management

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Framer Motion
- Prisma + PostgreSQL
- JWT auth
- pdf-parse for PDF import
- Socket.io-ready

## Quick Start
```bash
npm install
cp .env.example .env
# Update DATABASE_URL in .env
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000
