# Closet By Era

[![CI](https://github.com/AunMohammad254/Closet-By-Era/actions/workflows/ci.yml/badge.svg)](https://github.com/AunMohammad254/Closet-By-Era/actions/workflows/ci.yml)

A premium fashion e-commerce website built with **Next.js 16**, **TypeScript**, **Tailwind CSS 4**, and **Supabase**.

<div align="center">
  <a href="https://closet-by-era-two.vercel.app/">
    <img src="./src/app/icon.png" alt="Closet By Era Logo" width="100" />
  </a>

  <h3 align="center">Live Demo</h3>

  <a href="https://closet-by-era-two.vercel.app/">
    <img src="https://img.shields.io/badge/Visit_Live_Site-Closet_By_Era-e11d48?style=for-the-badge&logo=vercel&logoColor=white" alt="Visit Live Site" />
  </a>
  
  <p align="center">
    <strong>Premium Fashion • Modern Design • Seamless Shopping</strong>
  </p>
</div>

## ✨ Features

- 🛍️ **Product Catalog** - Browse products by category with filtering and sorting
- 🎨 **Modern Design** - Premium, sleek UI with smooth animations and gradients
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop
- 🔍 **Search** - Find products quickly with search functionality
- 💳 **Shopping Cart** - Add items, manage quantities, checkout
- ❤️ **Wishlist** - Save favorite items for later
- 👤 **User Accounts** - Register, login, order history
- 🏷️ **Sale Section** - Special discounts with percentage badges
- 📧 **Newsletter** - Email subscription for updates

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Fonts**: Inter, Outfit (Google Fonts)
- **Package manager**: Bun
- **Hosting**: Vercel (pages rendered in Mumbai, `bom1`, next to the database)

## 📁 Project Structure

```
closet-by-era/
├── src/
│   ├── app/
│   │   ├── (shop)/          # Storefront: home, departments, products, cart, checkout, account
│   │   ├── (admin)/         # Store admin: /admin and /dashboard
│   │   ├── (super-admin)/   # Owner panel: /super-admin
│   │   ├── auth/            # Sign in, register, password reset, email confirmation
│   │   └── api/webhooks/    # Stripe and Supabase auth-email webhooks
│   ├── actions/             # Server Actions (orders, coupons, gift cards, admin tools)
│   ├── components/          # UI components
│   ├── context/             # Auth, cart, wishlist and currency providers
│   ├── hooks/
│   ├── lib/                 # Supabase clients, catalog caching, payments, email, rate limiting
│   ├── types/               # Generated Supabase types (`bun run gen-types`)
│   └── proxy.ts             # Sign-in checks for account, checkout and staff pages
├── supabase/migrations/     # Database schema history (applied to production)
├── e2e/                     # Playwright tests and the local Supabase test stack
├── public/                  # Static assets and the PWA service worker
├── .github/workflows/ci.yml # CI
├── vercel.json              # Function region (bom1)
└── .env.example             # Every environment variable, with comments
```

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.4+ (package manager and script runner; `bun.lock` is the only lockfile)
- Node.js 24 (Next.js runs on Node; pinned to `24.x` in `package.json`, as on Vercel and in CI)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AunMohammad254/Closet-By-Era.git
   cd Closet-By-Era
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```
   Use `bun install --frozen-lockfile` in CI. Do not use npm/yarn/pnpm: their lockfiles are gitignored.

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in at least the Supabase values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   See [Environment Variables](#-environment-variables) for the rest.

4. **Set up the database**
   
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Apply the migrations in `supabase/migrations/` in order (`bunx supabase db push`, or paste them into the SQL editor)

5. **Run the development server**
   ```bash
   bun run dev
   ```

   Other scripts: `bun run build` (production build, webpack so the PWA service worker is generated), `bun run check` (typecheck + lint + tests), `bun run gen-types` (regenerate `src/types/supabase.ts`).

6. **Open in browser**
   
   Visit [http://localhost:3000](http://localhost:3000)

## 🧪 Testing & CI

```bash
bun run check        # typecheck + lint + unit tests (Jest)
bun run build        # production build
```

Every pull request (and every push to `master`) runs three jobs on GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)), on Ubuntu 24.04:

| Job | Steps |
|---|---|
| Typecheck, lint & unit tests | `bun install --frozen-lockfile`, `tsc --noEmit`, `eslint`, `jest --ci` |
| Production build | `next build --webpack` (no secrets needed) |
| End-to-end tests (Playwright) | Starts the local Supabase test stack in Docker, then runs the whole Playwright suite against a production build |

If the end-to-end job fails, the run keeps a `playwright-report` artifact (traces, screenshots and videos) for 14 days.

### End-to-end tests

The tests in `e2e/specs` drive a production build of the app against a local Supabase stack (`e2e/supabase`), with emails captured by MailDev. They need Docker.

```bash
bun run e2e:db:start   # start the local Supabase test stack
bun run test:e2e       # build into .next-e2e, serve on localhost:3123 and run every test
bun run e2e:report     # open the last HTML report
bun run e2e:db:stop    # stop the stack
```

- The first time, install the browser with `bunx playwright install chromium`.
- `E2E_SKIP_BUILD=1 bun run test:e2e` reuses the last build.
- The test database is `e2e/supabase/migrations/00000000000000_schema.sql`, a snapshot of the production schema, plus the test data in `e2e/supabase/seed.sql`. When a migration in `supabase/migrations` changes the schema, make the same change in the snapshot.

## 🎨 Design System

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Rose Primary | `#e11d48` | CTAs, highlights, sale badges |
| Slate Dark | `#0f172a` | Text, dark backgrounds |
| Rose Light | `#fda4af` | Accents, gradients |

### Typography

- **Headings**: Outfit (Google Fonts)
- **Body**: Inter (Google Fonts)

### Components

- **ProductCard**: Displays product with image, name, price, badges
- **Navbar**: Fixed header with search, cart, account icons
- **Hero**: Full-screen gradient with CTA buttons
- **Footer**: Links, social icons, newsletter

## 📊 Database Schema

The schema lives in [`supabase/migrations`](supabase/migrations). Main tables:

- `products`, `product_images`, `product_variants`, `categories` - Catalog
- `customers` - Accounts and staff roles (`customer`, `admin`, `super_admin`)
- `orders`, `order_items`, `returns` - Orders
- `cart_items`, `wishlist_items` - Signed-in carts and wishlists
- `reviews` - Product reviews (shown after approval)
- `coupons`, `gift_cards`, `promotions`, `loyalty_history` - Discounts and rewards
- `banners`, `popups`, `faqs`, `store_settings` - Store content
- `shipping_zones`, `shipping_rates`, `tax_rules` - Shipping and tax
- `support_tickets`, `support_messages` - Customer chat
- `audit_logs`, `login_history`, `analytics_events` - Admin records

The storefront reads products through RPC functions such as `get_featured_products_fast` and `get_products_optimized`, which return active products only.

## 🔒 Security

- Row Level Security (RLS) enabled on every table
- Public read access for products and categories
- Authenticated access required for orders and cart
- Account, checkout and staff pages require sign-in (`src/proxy.ts`); staff pages also need the `admin` or `super_admin` role
- Rate limiting on coupons, gift cards, orders and reviews (Upstash Redis)

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

```bash
bun run build
```

Vercel detects `bun.lock` and installs with Bun automatically.

Server-rendered pages run in Vercel's `bom1` (Mumbai) region, set in [`vercel.json`](vercel.json), next to the Supabase project (`ap-south-1`). If the database moves, move the function region with it: every page makes several database round trips, so a region far from the database adds roughly 200 ms to each one.

## 📝 Environment Variables

[`.env.example`](.env.example) lists every variable with setup notes. The main ones:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (required) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (required) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for admin actions (required, keep secret) |
| `ADMIN_EMAIL`, `SUPER_ADMIN_EMAIL` | Staff accounts allowed into `/admin` and `/super-admin` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Rate limiting (set by Vercel's Upstash integration; `UPSTASH_REDIS_REST_*` also works) |
| `EMAIL_PROVIDERS`, `EMAIL_FROM`, SMTP / Brevo / Resend settings | Order and account emails |
| `SEND_EMAIL_HOOK_SECRET` | Supabase Auth "Send Email" hook |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Card payments |
| `NEXT_PUBLIC_SITE_URL` | Public URL used in emails |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp chat button |
| `OPENAI_API_KEY` | AI Stylist |

## 🤝 Contributing

Open a pull request against `master`. CI must pass before merging.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with ❤️ by [AunMohammad254](https://github.com/AunMohammad254)
