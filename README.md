# Wedding Website

A full-stack wedding website with RSVP management, fuzzy guest matching, interactive table/seat maps, and a protected admin dashboard.

## Features

- **Landing Page** (`/`) — Elegant hero with countdown timer, wedding details, and quick links
- **RSVP Flow** (`/rsvp`) — Guests enter their name/phone; fuzzy matching finds their record even with typos or partial info (e.g., "Jon" → "John")
- **Find My Seat** (`/find-my-seat`) — Public page where confirmed guests can see their table and seat on an interactive venue map
- **Admin Panel** (protected)
  - **Dashboard** (`/admin`) — RSVP stats at a glance
  - **Guest Management** (`/admin/guests`) — Full CRUD for guests, CSV bulk import/export, search/filter by status
  - **Table Designer** (`/admin/tables`) — Interactive SVG map where you can add, position, resize, and rotate tables. Assign guests to tables/seats via dropdowns

## Tech Stack

- Next.js 16 (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + SQLite
- Fuse.js (fuzzy search)
- Iron Session (encrypted cookies)
- bcryptjs (password hashing)

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── rsvp/page.tsx               # RSVP flow
├── find-my-seat/page.tsx       # Seat finder + map
├── admin/
│   ├── login/page.tsx          # Admin login (public)
│   └── (protected)/            # Protected admin routes
│       ├── layout.tsx          # Auth check layout
│       ├── page.tsx            # Dashboard
│       ├── guests/page.tsx     # Guest CRUD + CSV
│       └── tables/page.tsx     # Table designer
├── api/                        # API routes
components/
└── table-map.tsx               # Reusable SVG venue map
prisma/
└── schema.prisma               # Database schema
```

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your own values:
   - `ADMIN_PASSWORD` — password for the admin panel
   - `SESSION_SECRET` — a random 32+ character string

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Admin Access

- Go to [http://localhost:3000/admin](http://localhost:3000/admin)
- Login with username `admin` and your `ADMIN_PASSWORD`

### Importing Guests

In the admin panel, go to **Guest Management** → **Import CSV**.

Expected CSV format:
```csv
firstName,lastName,phone,email,seatNumber,plusOne,plusOneName,notes
John,Doe,555-1234,john@example.com,,false,,
Jane,Smith,555-5678,jane@example.com,,true,John Smith,
```

## Deployment

### Docker

```bash
docker-compose up -d
```

The app will be available on port `3000`. The SQLite database is persisted in a Docker volume.

### Vercel

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add the environment variables from `.env`
4. Set the build command:
   ```
   npx prisma generate && npm run build
   ```
5. Deploy

> **Note:** Vercel's filesystem is ephemeral. For production use with Vercel, consider migrating to a hosted database (e.g., Vercel Postgres, PlanetScale, or Supabase) and updating the `DATABASE_URL`.

## Security Notes

- Change the default `ADMIN_PASSWORD` and `SESSION_SECRET` before deploying
- The admin panel is protected by encrypted HTTP-only cookies via `iron-session`
- Admin routes use a protected route group (`(protected)`) to avoid redirect loops on the login page
- Input validation via Zod on all API routes
- For production, consider adding rate limiting (e.g., via Vercel Edge Config or middleware)

## Customization

- Edit the wedding date in `app/page.tsx`
- Update colors in `app/globals.css`
- Replace the hero background image URL in `app/page.tsx`
- Adjust fuzzy search thresholds in `app/api/rsvp/route.ts`
