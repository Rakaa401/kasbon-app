# Kasbon

Kasbon is a simple personal debt tracker built with Next.js and Supabase. It helps users record money they are owed, money they owe, track payment status, and see a summary of their current balance.

## Demo

Vercel demo: `https://link.vercl.app`

## Features

- Email and password authentication
- Protected dashboard
- Record money owed to the user
- Record money the user owes
- Edit and delete debt records
- Mark debts as paid
- Summary of total owed to me, total I owe, and net balance
- Filter by payment status
- Filter by debt type
- Search by person
- Sort by date or amount
- Group multiple transactions by person
- Indonesian Rupiah formatting
- Relative dates such as `hari ini`, `kemarin`, and `3 hari lalu`
- Client-side and server-side validation
- Loading, empty, and error states
- Responsive mobile-first interface
- Row Level Security with Supabase

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Supabase PostgreSQL
- Supabase Auth
- Supabase SSR
- Lucide React

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   └── debts/
│   ├── components/
│   ├── login/
│   └── page.tsx
├── lib/
│   └── supabase/
└── proxy.ts

supabase/
└── migrations/
    └── 001_create_debts.sql
```

## Getting Started

### 1. Clone the repository

```bash
git clone 
cd kasbon
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The values can be found in the Supabase project settings.

### 4. Configure Supabase

Create a Supabase project and run the migration:

```text
supabase/migrations/001_create_debts.sql
```

The migration creates the `debts` table, debt type enum, indexes, update trigger, and Row Level Security policies.

### 5. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## API

All debt endpoints require an authenticated Supabase user.

### Get debts

```http
GET /api/debts
```

Optional filters:

```text
/api/debts?status=unpaid
/api/debts?status=settled
/api/debts?type=owed_to_me
/api/debts?type=i_owe
```

### Create debt

```http
POST /api/debts
```

Example request:

```json
{
  "type": "owed_to_me",
  "counterpart_name": "Budi",
  "amount": 150000,
  "note": "Makan bersama",
  "due_date": "2026-10-05"
}
```

### Update debt

```http
PATCH /api/debts/:id
```

The endpoint supports updating debt details and payment status.

Example:

```json
{
  "settled": true
}
```

### Delete debt

```http
DELETE /api/debts/:id
```

## Database and Security

Each debt belongs to the authenticated user through `user_id`.

Row Level Security is enabled on the `debts` table with policies that allow users to:

- Read their own debts
- Create their own debts
- Update their own debts
- Delete their own debts

Every policy checks:

```sql
auth.uid() = user_id
```

The API also authenticates the current user before performing database operations.

A cross-user RLS leakage test was performed using two separate test users. The test verified that one user could not read, update, or delete another user's debt records.

## Approach

The application uses Supabase Auth for authentication and Supabase PostgreSQL as the source of truth for debt data. Server-side API routes authenticate the current user before processing requests, while Row Level Security provides database-level isolation between users.

The dashboard receives initial data from the server and uses API routes for create, update, delete, filtering, and settlement operations. Client-side validation improves the user experience, while server-side validation ensures invalid input cannot bypass the UI.

For the interface, the application uses Tailwind CSS with a responsive layout and Indonesian-specific formatting for currency and relative dates.

## Trade-offs

The application intentionally keeps the architecture simple because the task focuses on core debt tracking functionality.

No additional client-side data fetching library was added. The current implementation uses the built-in Next.js and browser APIs together with the Supabase client.

If more time were available, the next improvements would be deeper UI polish, stronger automated testing, and more advanced analytics for debt history.

## Validation

The application validates:

- Required person name
- Debt type
- Positive whole-number Rupiah amount
- Maximum 200 characters for notes
- Valid dates
- Supported filter values
- Settlement status

Validation exists on both the client and server.

## Development Checks

Run linting:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

Both checks should pass before deployment.

## Deployment

The application can be deployed to Vercel.

Add these environment variables to the Vercel project:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

After deployment, verify:

- Login and signup
- Dashboard access
- Create debt
- Edit debt
- Mark as paid
- Delete debt
- Search
- Filters
- Sorting
- Grouping
- Logout
- Production Supabase connection

## Time Spent

Approximately 4 hours, including implementation, testing, RLS verification, responsive improvements, and deployment preparation.

## License

This project was created as part of a Junior Fullstack Developer hiring task