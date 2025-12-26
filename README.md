# Supermarket Management System

A Scalable, Multi-Tenant, Role-Based POS & Stock Management System.

## Features implemented
- **Multi-Tenant Architecture**: Data isolation by `supermarketId`.
- **Role-Based Auth**: Admin, Stock Manager, Billing Staff.
- **POS Interface**: Optimized for fast billing with barcode scanner support.
- **Premium UI**: Glassmorphism design with Dark Mode.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   This uses SQLite by default (change provider in `prisma/schema.prisma` for Postgres).
   ```bash
   npx prisma db push
   ```

3. **Seed Initial Data**
   Creates a default Supermarket and Admin user.
   ```bash
   npx tsx prisma/seed.ts
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Default Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Supermarket**: SuperMart One

## Architecture
- **Frontend**: Next.js 15 (React), Tailwind-like CSS variables (Vanilla CSS modules).
- **Backend**: Next.js API Routes.
- **Database**: Prisma ORM (SQLite/Postgres).
- **Auth**: JWT (Stateless) in HTTP-only cookies.

## API Documentation
See `design/api_contracts.md` and `design/database_schema.md`.
