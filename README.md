# Infinite Yatra - Enterprise Travel Operating System

## Architecture
This project is a monorepo containing:
- **apps/web**: Next.js 14 Frontend (App Router, Tailwind, ShadCN)
- **apps/api**: NestJS Backend (PostgreSQL, Prisma)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development servers:
   ```bash
   npm run dev
   ```
   - Web: http://localhost:3000
   - API: http://localhost:3001

## Deployment
- **Web**: Vercel (recommended)
- **API**: AWS / GCP / DigitalOcean (Dockerized)

## Commands
- `npm run build`: Build all workspaces
- `npm run test`: Test all workspaces
