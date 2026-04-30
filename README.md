# CardWise — Credit Card Recommendation System

CardWise helps you get the most out of your credit cards. Search any merchant or category and instantly see which card in your wallet earns the most rewards for that purchase — with a side-by-side comparison tool to evaluate any cards from the full catalog.

---

## Features

| Section | Description |
|---|---|
| **Home** | Hero search bar, popular categories, popular merchants, your top cards quick-access |
| **Recommend** | Type a merchant or pick a category to get a ranked recommendation with the best card highlighted and an explanation. Set a custom purchase amount for accurate reward calculations |
| **My Wallet** | Add, view, and remove your credit cards. Browse the full card catalog with instant Add/Remove per card |
| **Compare Cards** | Select up to 3 cards (from your wallet or the catalog) and compare side-by-side across annual fee, reward type, every spending category, point value, and network |
| **Insights** | Coming soon — spending analytics |
| **Transactions** | Coming soon — transaction tracking |
| **Alerts** | Coming soon — reward opportunity alerts |
| **Settings / Profile** | Personalization (cashback vs points preference), appearance (light/dark/system), display name, password |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth & Database**: Supabase (PostgreSQL + Row Level Security)
- **State Management**: Zustand
- **Deployment**: Vercel (recommended)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone the repo

```bash
git clone https://github.com/PriyankaChaganti/CreditCardRecommender.git
cd CreditCardRecommender
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key from **Supabase Dashboard → Project Settings → API**.

### 4. Set up the database

Run [`supabase/schema.sql`](supabase/schema.sql) in **Supabase Dashboard → SQL Editor**.

### 5. Seed catalog data

```bash
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> npx tsx scripts/seed-supabase.ts
```

Find the service role key at **Supabase Dashboard → Project Settings → API → service_role**.

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── (auth)/              # Login & signup pages
├── api/signout/         # Sign-out route handler
├── cards/[id]/          # Card detail page
├── compare/             # Compare cards page
├── wallet/              # My wallet + catalog browse
├── recommend/           # Recommendation engine page
├── profile/             # Settings page
├── insights/            # Coming soon
├── transactions/        # Coming soon
├── alerts/              # Coming soon
└── page.tsx             # Homepage

components/
├── Nav.tsx              # Sidebar (desktop) + top bar + drawer (mobile)
├── CardGrid.tsx         # Collapsible catalog grid with Add/Remove
├── CardList.tsx         # Wallet card grid
├── RecommendationResult.tsx  # Best card hero + why + other cards
├── CardsProvider.tsx    # Auth-aware store hydration
└── IssuerLogo.tsx       # Issuer logo component

lib/
├── merchant.ts          # Merchant → category resolution + autocomplete
├── recommendation.ts    # Ranking algorithm
├── catalogLoader.ts     # Supabase catalog loader with module-level cache
└── supabase/            # Browser + server Supabase clients

store/
└── useCardsStore.ts     # Zustand store (cards, preferences, hydration)

supabase/
└── schema.sql           # Full database schema with RLS policies

scripts/
└── seed-supabase.ts     # One-time catalog + merchant seeding script

docs/
└── api.yaml             # OpenAPI 3.0 specification
```

---

## Database Schema

See [`supabase/schema.sql`](supabase/schema.sql) for the full schema with RLS policies.

| Table | Description |
|---|---|
| `cards_catalog` | Full credit card catalog — public read-only |
| `merchant_categories` | Merchant key → spending category map — public read-only |
| `user_cards` | Cards saved to a user's wallet — private, per-user RLS |
| `user_preferences` | Point valuation and reward preference per user — private |

---

## API Documentation

See [`docs/api.yaml`](docs/api.yaml) for the full OpenAPI 3.0 specification.

All data operations go through the **Supabase client SDK** directly. The only custom HTTP endpoint is:

| Endpoint | Method | Description |
|---|---|---|
| `/api/signout` | GET | Signs the user out, clears auth cookies, redirects to `/login` |

---

## Reward Calculation

Rewards are calculated on a configurable purchase amount (default **$100**):

- **Cashback**: `amount × (multiplier / 100)` → dollar value
- **Points / Miles**: `amount × multiplier × point_value` → dollar equivalent

The highest dollar-equivalent card wins. Ties are shown without a winner highlight.

---

## Disclaimer

Reward rules change frequently by issuer and product. This tool is for personal use only — not financial advice.
