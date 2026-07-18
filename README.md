# Vynta — The Business Network

> What does your business need today?

The operating system for global business networking. Vynta is where the world's
businesses discover opportunity, talk business and build trust — LinkedIn for
companies, WhatsApp for business, Reddit communities, an Instagram feed and
Alibaba transactions, combined into one simple, premium product.

The atomic unit is the **Need** — a typed signal of demand or supply. The feed is
not content; it is a live market of business intent.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Product surfaces (MVP v1)

- **Landing** (`/`) — hero, live demand ticker, pillars, communities, trust CTA.
- **Auth** (`/auth`) — sign in / sign up.
- **Onboarding** (`/onboarding`) — 4-step company setup that guarantees a
  populated feed (no empty states).
- **Feed** (`/feed`) — the core loop: composer, type filters, Need cards, right rail.
- **Create Need** — opinionated typed composer (bottom sheet / modal).
- **Communities** (`/communities`) — countries, industries, topics + detail feeds.
- **Search** (`/search`) — companies + needs, instant filtering.
- **Company profile** (`/company/[id]`) — stats, products, activity.
- **Messages** (`/messages`) — WhatsApp-grade B2B chat with a pinned Need context banner.
- **Notifications** (`/notifications`) — opportunity-first (responses, matches, expiry).
- **Settings** (`/settings`) — appearance (light/dark/system), account, communities.

## Design system

- **Fonts:** Inter, tabular numbers for business figures.
- **Theme:** class-based dark/light/system with no-flash script. Tokens in
  `src/app/globals.css`.
- **Need types** carry meaning through color + icon (`src/lib/need-types.ts`):
  Sourcing, Selling, Service, Hiring, Partnership, Capacity, Announcement, Investment.
- **Motion:** Framer Motion — fast, physical, purposeful.

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4
- Framer Motion, Lucide icons

## Architecture

- `src/app/(app)/*` — authenticated app surfaces behind the responsive `AppShell`.
- `src/components/app-store.tsx` — client state (needs, saves, follows, messages,
  notifications, create-modal, toasts). Currently backed by mock data.
- `src/lib/mock-data.ts` — seed companies, communities, needs, conversations.
- `src/lib/types.ts` — the domain model.

## Next steps (backend)

The state layer in `app-store.tsx` and the domain model in `lib/types.ts` are
designed to map directly onto **Supabase (PostgreSQL, Auth, Storage, Realtime)**.
Suggested tables: `companies`, `members`, `needs`, `communities`,
`community_members`, `need_communities`, `follows`, `saves`, `conversations`,
`messages`, `notifications`, `products`. Wire Realtime to `messages`, `responses`
and `notifications`, and add Row-Level Security scoped by company/member.

Future (post-MVP): transactions, escrow, payments, contracts, AI matching.
