# TipTip

A simple web app for accepting tips via QR code / link. Powered by **Next.js**, **Stripe Connect**, and **PostgreSQL**.

## Features

- **Instant Onboarding**: Users sign up and connect their bank account via Stripe Express.
- **Public Profile**: Each user gets a `/u/username` page.
- **Easy Tipping**: Visitors can tip via Apple Pay / Google Pay / Card using Stripe Checkout.
- **Direct Payouts**: Funds flow from Tipper -> Platform -> Receiver (minus fees).

## Setup

### 1. Environment Variables

Create a `.env` file in the root:

```bash
# Database (e.g. from Neon, Supabase, or local Postgres)
DATABASE_URL="postgresql://user:password@host:port/database"

# Stripe (Get these from dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Base URL for redirects
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Generate the Prisma client and push the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Stripe Setup Guide

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/).
2. Enable **Connect**.
3. In Connect Settings, ensure **Express** accounts are enabled.
4. Add `http://localhost:3000/dashboard` and `http://localhost:3000/dashboard?connected=true` to your authorized redirect URIs if needed (usually handled dynamically for Express).
