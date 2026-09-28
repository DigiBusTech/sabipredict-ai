# SabiPredict AI ⚽🤖

**SabiPredict AI** is a production-grade, full-stack quantitative football analytics and sports prediction platform built with **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, Auth & Row Level Security)**.

The platform ingests live fixture and odds data from the **Sportsmonks Football API v3**, calculates Expected Value ($+EV$) and Poisson expected goals ($xG$), stages predictions for administrative moderation, and serves them on a high-trust Deep Navy analytics interface featuring date-based navigation (**Yesterday**, **Today**, **Tomorrow**, and an interactive **Calendar Date Picker**).

---

## 🛡️ Architecture & Core Modules

### 1. Database Schema & RLS Migrations (`supabase/schema.sql`)
- **`public.profiles`**: Extends `auth.users(id)` with Role-Based Access Control (`admin`, `vip_user`, `free_user`), subscription status, and tier.
- **`handle_new_user()` Trigger**: Automatically creates a profile record upon user signup.
- **`public.predictions`**: Stores matches, odds, markets, AI reasoning, and **Past Outcomes**:
  - `home_score` (`INTEGER`)
  - `away_score` (`INTEGER`)
  - `prediction_outcome` (`'Won'`, `'Lost'`, `'Pending'`, `'Void'`)
- **`public.blog_posts`**: Full SEO blogging system with markdown support and author info.
- **`public.system_settings`**: Real-time admin settings stored in PostgreSQL so API keys and LLM settings can be modified from the UI without redeploying:
  - `sportsmonks` (API token)
  - `payment_gateways` (Active provider, Stripe/Paystack public & secret keys, manual bank details)
  - `ai_llm_settings` (Active provider: Groq or Gemini, model selection, custom System Prompt)
- **`public.subscription_plans`**: Admin-managed pricing plans for Free and VIP Lounge memberships.
- **Row Level Security (RLS)**: Enforced via PostgreSQL policies with security definer functions (`is_admin()` and `has_vip_access()`).

### 2. The Admin Super-Dashboard (`/admin`)
Protected layout requiring `user.role === 'admin'`. Hosts 4 distinct management tabs:
1. **Predictions Moderation**: CRUD interface to pull live Sportsmonks fixtures, trigger AI predictions, approve Free/VIP tips, input final scores (`home_score` - `away_score`), and settle predictions as **WON** or **LOST**.
2. **Blog Management**: Full CRUD interface to write, edit, and publish SEO football articles.
3. **API Management**: Secure form to update Sportsmonks API Key and Payment Gateway keys (Stripe, Paystack, Manual Bank) stored in `system_settings`.
4. **AI & LLM Management**: Panel to select the active AI provider (Groq / Gemini), model name, and edit the quantitative **System Prompt**.
5. **Subscription Plans**: CRUD interface to adjust pricing, intervals, and feature lists.

### 3. Monetization & Subscriptions (`/pricing`)
- Transparent display of **Free** and **VIP Lounge** tiers loaded dynamically from Supabase.
- Server action to handle checkout sessions (scaffolding for Paystack, Stripe, and Manual bank deposit verification).
- Strict VIP Lockout: On `/predictions`, VIP predictions are blurred/locked with a lock icon if `user.role !== 'vip_user'`.

### 4. Dynamic Public Frontend
- **High-Trust Analytics Design**: Deep Navy Blue (`#0B132B`, `#111C38`, `#1C2541`) with strict color-coded outcome badges:
  - **WON**: Emerald Green
  - **LOST**: Rose Red
  - **PENDING**: Amber
- **Header & Navigation**: Reflects real Supabase Auth session (Login / Sign Up / User Profile / Admin Panel for admins).
- **Date Selector**:
  - **Yesterday**: Prominently displays final match scores (`home_score` - `away_score`) and whether the AI's tip WON or LOST.
  - **Today**: Live matchday predictions with model confidence and kickoff countdowns.
  - **Tomorrow / Calendar Picker**: Advance fixtures and early odds value.
- **VIP Lounge (`/vip`)**: Banker of the Day and exclusive VIP value bets.


---

## 📁 Repository Structure

```
sabipredicts/
├── app/
│   ├── actions/                  # Next.js Server Actions ('use server')
│   │   ├── auth.ts               # Sign in, Sign up, Sign out
│   │   ├── blog.ts               # Article CRUD
│   │   ├── predictions.ts        # Moderation, score settlement, AI generation
│   │   ├── settings.ts           # Sportsmonks, Stripe/Paystack, LLM config
│   │   └── subscription.ts       # Plans & checkout session scaffolding
│   ├── admin/                    # Admin Super-Dashboard (Role: admin protected)
│   ├── api/cron/                 # Ingestion & generation route handlers
│   ├── blog/                     # Football intelligence blog & article reader
│   ├── login/ & signup/          # Supabase Auth client flows
│   ├── predictions/              # Public predictions feed with Date selector
│   ├── pricing/                  # Monetization & subscription tiers
│   ├── vip/                      # VIP Lounge & Banker of the Day
│   ├── layout.tsx                # Root layout with dynamic session check
│   └── page.tsx                  # Landing page & live prediction feed
├── components/
│   ├── admin/                    # Moderation, Blog, API, AI & Plans tabs
│   ├── DateSelectorBar.tsx       # Core Date navigation (Yesterday/Today/Tomorrow)
│   ├── CalendarPickerModal.tsx   # Interactive calendar jump modal
│   ├── PredictionCard.tsx        # Card with scores, outcomes, and VIP blur
│   ├── StatsSummary.tsx          # Win rate, odds, active tips summary
│   ├── Header.tsx & Footer.tsx   # Brand shell with auth state
│   └── PricingClient.tsx         # Plan cards & checkout initialization
├── lib/
│   ├── ai-engine.ts              # Poisson goal distribution & LLM integration
│   ├── db.ts                     # Supabase data layer queries
│   ├── sportsmonks.ts            # Sportsmonks API v3 client & fallback
│   ├── types.ts                  # TypeScript types & interfaces
│   └── utils.ts                  # Styling and time helpers
├── middleware.ts                 # Route proxy & session refresh
├── supabase/
│   ├── schema.sql                # Production DDL, triggers & RLS policies
│   └── seed.sql                  # Initial match outcomes & blog posts
└── .env.example                  # Environment variables template
```

---

## 🛠️ Environment Configuration (`.env.local`)

Create a `.env.local` file with your credentials:

```env
# Supabase PostgreSQL & Auth (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sportsmonks Football API v3 (Optional: fallback generator runs if empty)
SPORTSMONKS_API_KEY=your_sportsmonks_api_key_here

# Cron Security Token
CRON_SECRET=sabipredict_secret_token_12345
```

---

## 📦 Running Locally & Setting Up Database

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Supabase Migrations**:
   - Open your [Supabase Dashboard](https://supabase.com).
   - Go to **SQL Editor** -> run the contents of `supabase/schema.sql`.
   - Run the contents of `supabase/seed.sql` to populate sample fixtures, past settled outcomes, and blog posts.

3. **Grant Admin Role to Your Account**:
   - Register an account on [http://localhost:3000/signup](http://localhost:3000/signup).
   - In Supabase SQL Editor, run:
     ```sql
     UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
     ```
   - Log back in to immediately access the `/admin` Super-Dashboard.

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```


---

## 👨‍💻 Author & Contributions

Built by **[DigiBusTech](https://github.com/DigiBusTech)** (Uyouko Nathaniel Ekpo).
Contributions and feature requests are welcome!

