# Project Passdown — Wedding Website

> **For future context windows:** This file contains everything you need to know about this project, how it was built, what went wrong, and what to try next.

---

## What This Project Is

A full-stack wedding website for Adrian & Katelyn's wedding on March 28, 2027. It handles guest RSVPs with fuzzy name matching, a three-tier event system (Tea Ceremony → Vow Ceremony → Reception), an interactive table/seat map, and a protected admin dashboard for managing guests and seating.

### Key Features
- **Landing page** with countdown timer and event schedule
- **RSVP flow** with fuzzy matching (handles typos like "Jon" → "John")
- **Three-tier events** — guests can be invited to any combination of Tea (1pm), Vow Ceremony (3pm), Reception (6pm)
- **Cookie persistence** — after RSVPing, a 1-year cookie auto-loads their seat info on `/find-my-seat`
- **Interactive table map** — SVG-based venue layout, admin can drag/position tables and assign guests
- **CSV import/export** for bulk guest management
- **Admin auth** with bcrypt + iron-session encrypted cookies

### Tech Stack
- Next.js 16 (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + SQLite
- Fuse.js (fuzzy search)
- iron-session (cookie-based auth)
- bcryptjs (password hashing)

---

## How It Was Developed

### Initial Setup
1. `npx shadcn@latest init --defaults --name my-app` created the Next.js project with shadcn/ui
2. Installed Prisma 6 (not 7 — Prisma 7 had breaking changes with SQLite `url` in schema)
3. Set up SQLite database with Guest, Table, and Admin models
4. Seeded admin user with bcrypt hashed password

### Route Structure
- `/` — Landing page (public)
- `/rsvp` — Multi-step RSVP flow (public)
- `/find-my-seat` — Seat lookup with auto-load from cookie (public)
- `/admin/login` — Admin login (public)
- `/admin` — Dashboard (protected via `(protected)` route group)
- `/admin/guests` — Guest CRUD + CSV (protected)
- `/admin/tables` — Table designer (protected)

### Auth Architecture
Used a Next.js route group `(protected)` inside `/admin/` so the auth layout only applies to protected pages. The login page sits outside the group and is public. This avoids the classic infinite redirect loop where the login page inherits the auth layout.

### Fuzzy Search
Initially tried Fuse.js with multi-key search (`firstName`, `lastName`, `phone`) but multi-word queries ("John Doe") returned empty. Fixed by creating a combined `searchText` field per guest (`"firstName lastName phone email"`) and searching against that single field with `ignoreLocation: true`.

### Cookie Persistence
- RSVP page sets `wedding-guest-id=<guestId>` cookie (1 year expiry) on successful submit
- Find My Seat page checks for this cookie on mount via `useEffect`
- If found, auto-fetches via `/api/find-seat` with `guestId` parameter
- Includes a "Clear my info" button to delete the cookie

---

## Things That Went Wrong

### 1. Node.js Version Hell
**Problem:** `winget install OpenJS.NodeJS` installed Node 26.1.0 — a preview/experimental build that doesn't exist as a stable release. It spammed `[DEP0205] DeprecationWarning: module.register() is deprecated` endlessly, causing the dev server to hang and pages to load forever.

**Fix:** Uninstalled Node 26, installed Node 24 LTS via `winget install OpenJS.NodeJS.LTS`.

### 2. ERR_TOO_MANY_REDIRECTS on /admin/login
**Problem:** The admin layout (`app/admin/layout.tsx`) checked auth and redirected to `/admin/login` for ALL pages under `/admin/`, including the login page itself. This caused an infinite redirect loop.

**Fix:** Restructured routes using a `(protected)` route group. Login page stays at `app/admin/login/page.tsx` (public), while dashboard/guests/tables moved to `app/admin/(protected)/` (inherits auth layout). Route groups don't affect URLs.

### 3. Stale Server Running Old Code
**Problem:** After making code changes, the production server (`npm start`) was still serving the old compiled code from `.next/`. This caused confusing bugs where APIs returned wrong results or new features didn't work.

**Fix:** Must run `npm run build` after EVERY code change before `npm start`. The dev server (`npm run dev`) auto-recompiles but is heavier on memory.

### 4. EADDRINUSE — Port 3000 Already in Use
**Problem:** Background bash tasks on Windows don't properly kill child Node processes when they exit. Multiple Next.js servers accumulated, fighting over port 3000.

**Fix:** Use PowerShell to force-kill:
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```
Or the bash equivalent that actually works:
```bash
powershell.exe -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
```

### 5. Prisma 7 Breaking Changes
**Problem:** `npx prisma migrate dev` failed with "The datasource property `url` is no longer supported in schema files." Prisma 7 requires a separate `prisma.config.ts` file.

**Fix:** Downgraded to Prisma 6 (`npm install prisma@6 @prisma/client@6`) which still supports the traditional schema format.

### 6. Prisma Generate File Lock (EPERM)
**Problem:** `npx prisma generate` failed with `EPERM: operation not permitted, rename` because a Node process had the query engine file locked.

**Fix:** Kill all Node processes before running Prisma commands.

### 7. `next start` vs `output: 'standalone'`
**Problem:** Next.js 16 warned: `"next start" does not work with "output: standalone" configuration`. The server would start but with warnings.

**Fix:** Commented out `output: 'standalone'` in `next.config.mjs` for local development. Re-enable for Docker builds.

### 8. Git Bash vs CMD Syntax Confusion
**Problem:** The user switches between Git Bash, CMD, and PowerShell. Commands like `taskkill //F //IM node.exe` work in Git Bash (bash converts `//` to `/`) but fail in CMD/PowerShell with "Invalid argument/option - '//F'".

**Lesson:** Always provide Windows-native syntax (`taskkill /F /IM node.exe`) and note when bash escaping is needed.

---

## Architecture Decisions Worth Knowing

### Why SQLite?
- Zero-config, file-based, perfect for a single-event dataset
- Easy to back up (just copy the `.db` file)
- No external database server needed
- **Trade-off:** Not suitable for serverless hosts with ephemeral filesystems (Vercel). For Vercel, migrate to a hosted DB.

### Why Fuse.js instead of SQL LIKE queries?
- SQL `LIKE '%jon%'` wouldn't match "John" — it's exact substring only
- Fuse.js handles typos, transpositions, and partial matches natively
- Combined `searchText` field approach makes multi-word queries work

### Why Route Groups for Auth?
- Next.js App Router layouts are segment-scoped
- Without a route group, ANY page under `/admin/` inherits the layout
- Route groups `(protected)` allow selective layout application without changing URLs

---

## Things Worth Trying Next

### High Priority
1. **Rate limiting** — Add basic rate limiting to RSVP lookup and admin login APIs. Currently vulnerable to brute force. Options:
   - `lru-cache` based in-memory rate limiter (simple, single-instance)
   - Vercel Edge Config (if deploying to Vercel)
   - Upstash Redis (if scaling)

2. **Email notifications** — Send confirmation emails after RSVP. Could use:
   - Resend (simplest, generous free tier)
   - SendGrid
   - Nodemailer + SMTP

3. **Photo gallery** — Add a `/gallery` page for engagement photos or a live wedding photo upload feature

### Medium Priority
4. **Real-time RSVP dashboard** — Use Server-Sent Events or polling to update the admin dashboard stats without refreshing

5. **Bulk table assignment** — In the admin, allow selecting multiple guests and assigning them all to a table at once

6. **Dietary restrictions report** — Admin page showing all dietary notes aggregated (e.g., "3 vegetarians, 2 nut allergies")

7. **RSVP deadline** — Add a configurable deadline after which the RSVP page shows a "RSVPs are closed" message

### Low Priority / Nice to Have
8. **Multi-language support** — i18n for bilingual weddings (e.g., English + Chinese for the tea ceremony context)

9. **QR codes** — Generate QR codes per guest that link directly to their RSVP or seat info

10. **Music requests** — Add a field for guests to request songs for the reception playlist

11. **Switch from SQLite to PostgreSQL** — If the guest list grows very large or if deploying to Vercel

---

## How to Modify the Website

### Landing Page (`app/page.tsx`)

| What to Change | Where | Notes |
|---|---|---|
| Couple names | Lines with `Adrian <span className="text-stone-400">&</span> Katelyn` | Update both the hero and footer |
| Wedding date | `new Date("2027-03-28T15:00:00")` | ISO format. Also update the text "Sunday, March 28th, 2027" |
| Event times | The three event cards (Tea/Vow/Reception) | Each has time, room name, and description |
| Venue name/address | "The Garden Estate" and "123 Blossom Lane" | Update in both hero and footer sections |
| Background image | The `bg-[url('https://images.unsplash.com/...')]` line | Replace with your own image URL or remove the opacity overlay |
| Countdown timer | The `weddingDate` constant | Automatically calculates from this date |

**Hero background image tip:** The current image is loaded from Unsplash via URL. To use a local image:
1. Put your image in `public/` (e.g., `public/hero.jpg`)
2. Change the CSS to: `bg-[url('/hero.jpg')]`

### Colors & Theme (`app/globals.css`)

The site uses Tailwind's `stone` color palette (warm beige/grey tones). To change the overall color scheme:

- **Background:** `bg-stone-50`, `bg-stone-100` (light), `bg-stone-800`, `bg-stone-900` (dark)
- **Text:** `text-stone-900` (headings), `text-stone-600` (body), `text-stone-500` (muted), `text-stone-400` (very muted)
- **Borders/accents:** `border-stone-200`, `bg-stone-200`
- **Buttons:** `bg-stone-800 text-white` (primary), `border-stone-800 text-stone-800` (outline)

To switch to a completely different palette (e.g., `slate`, `zinc`, `neutral`, `gray`):
1. Search-and-replace `stone` with your chosen color name across all files
2. Or change the shadcn base color: edit `components.json` and run `npx shadcn add` to regenerate

### Fonts (`app/layout.tsx`)

Current fonts:
- **Headings:** Playfair Display (serif, elegant)
- **Body:** Inter (sans-serif, clean)

To change:
1. Import different fonts from `next/font/google`
2. Update the `variable` names and apply them in the `<html>` and CSS

### RSVP Page (`app/rsvp/page.tsx`)

| What to Change | Where |
|---|---|
| Form fields | The input sections in each step |
| Event display colors | The amber/stone/green dots for Tea/Vow/Reception |
| Success message text | In the `step === "success"` block |
| Cookie expiry | `expiry.setFullYear(expiry.getFullYear() + 1)` — change the `+ 1` |

### Find My Seat (`app/find-my-seat/page.tsx`)

| What to Change | Where |
|---|---|
| Cookie name | `wedding-guest-id` — search and replace |
| Auto-loading behavior | The `useEffect` at the top |
| "Clear my info" button | The red button that calls `document.cookie = ...` |

### Admin Dashboard (`app/admin/(protected)/page.tsx`)

- Stats cards pull from `/api/admin/guests` and `/api/admin/tables`
- Colors: green for confirmed, red for declined, amber for pending

### Admin Guest Management (`app/admin/(protected)/guests/page.tsx`)

| What to Change | Where |
|---|---|
| CSV import format | The `Papa.parse` block and the column mapping |
| Export CSV columns | The `headers` array and `rows.map` |
| New guest default fields | The `useState` for `newGuest` |
| Table columns | The `<table>` structure near the bottom |

### Admin Table Designer (`app/admin/(protected)/tables/page.tsx`)

| What to Change | Where |
|---|---|
| Default table size | The `newTable` useState defaults |
| Map dimensions | The SVG `viewBox` (currently 800x600) |
| Grid line colors | The `stroke="#e7e5e4"` lines in the SVG |
| Table colors | The `fill` and `stroke` values in the `<circle>` and `<rect>` elements |

### Table Map Component (`components/table-map.tsx`)

This is the reusable SVG map used by both the admin designer and the public Find My Seat page.

| What to Change | Where |
|---|---|
| Highlight animation | The `animate-pulse` class on highlighted tables |
| Seat count display | The text showing `guests.length/seats` |
| Table label font size | The `style={{ fontSize: "12px" }}` values |

### API Routes (`app/api/`)

| Route | Purpose | Key Config |
|---|---|---|
| `/api/rsvp` | Guest lookup + RSVP submit | Fuzzy search threshold: `0.3`, filter: `< 0.4` |
| `/api/find-seat` | Seat lookup by name or guestId | Also filters for `rsvpStatus: "confirmed"` |
| `/api/admin/login` | Auth + logout | Uses bcrypt + iron-session |
| `/api/admin/guests` | CRUD + CSV import/export | Zod validation schema |
| `/api/admin/tables` | Table CRUD | Returns tables with guests included |

### Database Schema (`prisma/schema.prisma`)

**Adding a new field to guests:**
1. Edit `prisma/schema.prisma`
2. Add the field to the `Guest` model
3. Run `npx prisma migrate dev --name describe_your_change`
4. Run `npx prisma generate`
5. Update the API routes and frontend pages to use the new field
6. Rebuild: `npm run build`

**Current Guest fields:**
- `firstName`, `lastName`, `phone`, `email`
- `tableId`, `seatNumber`
- `plusOne`, `plusOneName`
- `invitedToTea`, `invitedToCeremony`, `invitedToReception`
- `dietaryNotes`
- `rsvpStatus` (`pending` | `confirmed` | `declined`)
- `rsvpDate`
- `notes`

### Environment Variables (`.env`)

| Variable | What it does | Change when? |
|---|---|---|
| `DATABASE_URL` | SQLite file location | Rarely — only if moving the DB |
| `ADMIN_PASSWORD` | Default admin login password | **Before deploying!** |
| `SESSION_SECRET` | Encryption key for cookies | **Before deploying!** Generate random 32+ chars |

**To change the admin password after the DB is seeded:**
1. Update `ADMIN_PASSWORD` in `.env`
2. Run `npx prisma db seed` to re-seed with the new hash
3. Or manually hash a password and update the `Admin` row in the DB

### Adding a New Page

1. Create `app/new-page/page.tsx`
2. If it needs to be protected, put it inside `app/admin/(protected)/`
3. If it needs an API, create `app/api/new-route/route.ts`
4. Add a link to it from existing pages
5. Run `npm run build`

### Changing the Favicon

Replace `app/favicon.ico` with your own `.ico` file.

---

## Quick Reference

### Kill the server
```bash
powershell.exe -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
```

### Start production server
```bash
npm run build
nohup npm start > server.log 2>&1 &
```

### Check if running
```bash
curl http://localhost:3000/
```

### Reset database (careful!)
```bash
rm prisma/prisma/dev.db
npx prisma migrate dev
npx prisma db seed
```

### Rebuild after code changes
```bash
npm run build
```

---

## Current State

- **Branch:** `main` (working wedding site)
- **Template branch:** `template` (clean base code)
- **Couple:** Adrian & Katelyn
- **Date:** March 28, 2027
- **Admin login:** `admin` / set in `.env` (`ADMIN_PASSWORD`)
- **Database:** `prisma/prisma/dev.db` (SQLite)

---

## Contact / Ownership

- GitHub repo: `https://github.com/SisypheanBoulder/Wedding-website-`
- Local path: `C:\Users\Mainstation\Documents\Code\wedding`
