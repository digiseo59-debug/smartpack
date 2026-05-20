# SmartPack Web App — Context for Future Claude Sessions

## Project Overview

Next.js + Supabase business management app for **Smart Pack**, a packaging company in Meknes, Morocco. Web + PWA mobile. Two roles: **admin** and **salarie** (employee).

Originally a single-file HTML app, rebuilt from scratch as full-stack web app.

## Tech Stack

- **Framework:** Next.js 16.2.6 (App Router, Turbopack)
- **Database/Auth:** Supabase (PostgreSQL + Auth + RLS)
- **Styling:** Tailwind CSS v4 with `@theme inline` custom colors
- **UI:** React 19, `@supabase/supabase-js` (NOT `@supabase/ssr` — see notes)
- **Deploy target:** Vercel
- **PWA:** manifest.json + standalone display

## Branding & Design

**Color scheme:** White / Gold (#c8a960) / Black (#1a1a1a) — luxury premium feel.
Originally was green (#2d7a3e) — user rejected. NO green anywhere.

**Logo:** `/public/logo.jpg` (Smart Pack circular logo)

**Theme:** Light/Dark toggle in header — `ThemeProvider` at `src/lib/theme/theme-context.tsx`. Uses CSS variables in `globals.css` for both modes. Class `.dark` applied to `<html>` element.

**Typography:** Inter font. Headings bold/tight tracking. Use `text-xs uppercase tracking-wider` for labels.

## Critical Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Tailwind v4 theme with white/gold/black palette + light/dark CSS vars |
| `src/lib/supabase/client.ts` | Browser Supabase client (singleton, localStorage session) |
| `src/lib/auth/auth-context.tsx` | AuthProvider with 3s failsafe timeout |
| `src/lib/theme/theme-context.tsx` | Light/dark theme toggle |
| `src/middleware.ts` | DISABLED (just returns next) — auth handled client-side |
| `src/app/(app)/layout.tsx` | App shell — waits for `user && profile` before render |
| `src/components/layout/app-header.tsx` | Black gradient header with theme toggle |
| `src/components/layout/bottom-nav.tsx` | Mobile bottom nav + desktop sidebar |

## Auth Architecture (IMPORTANT)

**Why no middleware:** Originally used `@supabase/ssr` middleware to gate routes. Created redirect loops because cookies didn't sync between login + redirect. Middleware now a no-op — auth handled entirely client-side via `AuthProvider`.

**Session storage:** `localStorage` (key: `smartpack-auth`). NOT cookies.

**Client config:**
```typescript
createSupabaseClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
    storageKey: 'smartpack-auth',
  }
})
```

**Flow:** Login form → `signInWithPassword` → `window.location.href = '/ventes'` (full reload). AuthProvider reads session from localStorage on mount.

**Failsafe:** AuthProvider has 3-second timeout — `setLoading(false)` always called eventually, never hangs.

## Supabase Project

- **URL:** `https://wtmjtjgidwuzpxmudrtw.supabase.co`
- **Project ID:** `wtmjtjgidwuzpxmudrtw`
- **Schema:** `supabase/migrations/001_initial_schema.sql`
- **Seed:** `supabase/seed.sql`
- **Access token:** (stored in password manager — not committed)
- Keys in `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

### Test users:
- **Admin:** `admin@smartpack.ma` / `SmartPack2026!` (id: `93fff78b-8227-4d0f-9f03-0a6e7d64f65e`)
- **Salarie:** `mehdi@smartpack.ma` / `Mehdi2026!` (id: `8099c72b-0ae6-443e-b5ae-770f22a76fcd`)

### Tables (12):
profiles, clients, categories, products, suppliers, sales, sale_items, purchases, purchase_items, expenses, stock_movements, settings

### Key DB function:
- `create_sale(client_id, items[], payment_mode, is_credit, credit_amount, is_gift, notes)` — atomic sale creation with stock decrement

## Pages

### Public
- `/login` — split-screen login (dark branding panel + form)

### App (requires auth)
- `/` — redirect to /ventes or /login
- `/ventes` — sales list, grid layout, FAB to create
- `/ventes/nouveau` — new sale form (client picker, articles, payment)
- `/ventes/[id]` — sale detail + receipt + WhatsApp share + print
- `/achats` — purchases list (admin can create)
- `/achats/nouveau` — new purchase
- `/stock` — products list with stock status
- `/clients` — clients directory
- `/dashboard` — admin-only KPIs + receivables
- `/admin` — admin hub (links to sub-pages)
- `/admin/users` — user management
- `/admin/categories` — categories CRUD
- `/admin/products` — products CRUD with stock_type (normal/serigraphie)
- `/admin/suppliers` — suppliers CRUD
- `/admin/expenses` — expenses tracking
- `/admin/settings` — business settings

## Deployment

- **GitHub repo:** `https://github.com/digiseo59-debug/smartpack`
- **Vercel team:** `digiseo59-4417s-projects`
- Branch: `master`
- Build: `next build` (turbopack)
- Output: `standalone`

## Known Issues / Pending

- [ ] **PDF receipts** — user requested invoice/facture as PDF (not done yet)
- [ ] **Dark mode** — toggle exists but pages not fully verified in dark mode
- [ ] **Profile RLS** — RLS policy on `profiles` table may need verification (anon returns empty, authenticated should return own row)
- [ ] **Dashboard redesign** — user wants data-dense pattern per UI/UX skill

## Recent Decisions

- Switched from `@supabase/ssr` (cookies) to `@supabase/supabase-js` (localStorage) due to session sync issues
- Disabled middleware — caused redirect loops
- Login uses `window.location.href` (not `router.push`) to force full reload + session re-read
- Brand changed: `MolEmballage.ma` → `Smart Pack` everywhere (login, receipt, WhatsApp, layout meta)
- Theme color in manifest.json and layout metadata: `#1a1a1a` (was green)

## User Preferences

- Caveman mode enabled — drop articles/filler in responses
- Wants minimal questions — "finish all the work for me ask only for access"
- Rejected green branding — wants luxury white/gold/black
- Wants PWA mobile + desktop both polished

## Common Commands

```bash
# Dev server
npm run dev  # http://localhost:3000

# Build
npx next build

# Restart cleanly
taskkill //F //IM node.exe; npm run dev
```

## Debugging Tips

- If `/ventes` shows infinite spinner: check browser console, check localStorage has `smartpack-auth` key
- If admin shows as salarie: profile query failing (RLS or null) — check `AuthProvider` profile fetch
- Brave/private mode may strip localStorage — test in regular Chrome/Edge
