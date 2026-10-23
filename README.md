# RupeePilot

A private-first personal budgeting web app built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, and PostgreSQL.

## Included in this starter

- Email/password sign-up and sign-in
- Protected dashboard
- Create or update a monthly income plan
- Category allocations for home, SIP, savings, bills, personal spending, and buffer
- Manual income and expense transactions
- Budget summary and category spending progress
- Supabase Row Level Security
- Server-side validation and Supabase SSR cookie handling
- Placeholder routes and types for future bank imports and AI assistant

## 1. Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project
- A Vercel account for online deployment

## 2. Install

```bash
npm install
cp .env.example .env.local
```

On Windows Command Prompt, use:

```bat
copy .env.example .env.local
```

Fill `.env.local` with the Project URL and publishable/anon key from Supabase Project Settings > API Keys.

## 3. Create the database

In Supabase, open SQL Editor, create a new query, and run the complete contents of `supabase/schema.sql`.

This schema enables Row Level Security and policies on every user-owned table. The app uses `auth.uid()` to scope each user's records.

## 4. Configure Supabase Auth

In Supabase Authentication > URL Configuration:

- Set Site URL to your local URL during development, such as `http://localhost:3000`.
- Add `http://localhost:3000/auth/callback` to Redirect URLs.
- When deployed, set the production Site URL and add `https://YOUR-DOMAIN/auth/callback`.

For public sign-up, disable neither sign-up nor email confirmation unless you intentionally choose that policy. If email confirmation is enabled, users must confirm their email before the session is created.

## 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

## 6. Deploy privately on Vercel

1. Push this project to a private GitHub repository.
2. Import the repository into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Project Settings > Environment Variables.
4. Deploy.
5. Add the production URL to Supabase Auth's Site URL and Redirect URLs.
6. Test sign-up, sign-in, sign-out, budget saving, and transaction entry with two separate test users.

The app is private in the sense that dashboard routes require authentication and database rows are protected by RLS. If you need an invite-only product rather than public sign-up, disable public sign-ups in Supabase and create accounts through a controlled admin process.

## Data model

- `profiles`: currency and user preferences
- `monthly_budgets`: one plan per user per month
- `budget_allocations`: planned amounts by category
- `transactions`: manual transaction ledger
- `bank_connections`: placeholder for future consent-based integrations
- `import_batches`: placeholder for import auditing

All money amounts are stored as integer paise. The first version does not connect to bank accounts or move money.

## Important implementation boundary

Bank import and AI assistant routes are not connected to a provider yet. They intentionally return a clear not-configured response. Do not add bank credentials or API secrets to browser code. Before enabling bank imports, implement provider consent, verified callbacks, secure token storage, import reconciliation, duplicate handling, and provider-specific compliance. Before enabling AI, use server-side tools that query only the authenticated user's records and calculate all financial amounts in deterministic application code.
