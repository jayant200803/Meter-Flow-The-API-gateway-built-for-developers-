# MeterFlow — Usage-Based API Billing & Metering Platform

> A production-grade API gateway and metering platform. Developers register APIs, issue API keys to consumers, and every request passing through the gateway is authenticated, rate-limited, logged, and billed automatically.
>
> Inspired by: **Stripe Billing · AWS API Gateway · RapidAPI · Kong Gateway**

---

## Table of Contents

1. [What is MeterFlow?](#what-is-meterflow)
2. [Live Demo](#live-demo)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Project Structure](#project-structure)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)
9. [Getting Started](#getting-started)
10. [Verification Checklist](#verification-checklist)
11. [Key Design Decisions](#key-design-decisions)

---

## What is MeterFlow?

MeterFlow sits between your API consumers and your upstream APIs. Every HTTP request passes through a central **gateway** that:

- Validates the caller's API key
- Enforces per-minute and monthly rate limits
- Forwards the request to the real upstream API
- Logs the request (endpoint, latency, status code, IP)
- Tracks monthly usage for billing
- Fires real-time Socket.io events to the dashboard

At the end of each billing period, a cron job calculates per-request costs and generates invoices automatically.

**Who is this for?**
Any developer who exposes APIs to third parties and wants to meter, rate-limit, and charge for usage — without building the infrastructure from scratch.

---

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://meter-flow-the-api-gateway-built-for-9d4h.onrender.com |
| **Backend API** | https://meter-flow-the-api-gateway-built-for.onrender.com |
| **Health Check** | https://meter-flow-the-api-gateway-built-for.onrender.com/health |

```
Email:    demo@meterflow.dev
Password: Demo123!
```

> **Note:** Hosted on Render free tier — backend may take ~30s to wake up on first visit.

After login, navigate to **API Keys**, generate a key, then test the gateway:

```bash
curl -X GET https://meter-flow-the-api-gateway-built-for.onrender.com/gateway/{apiId}/pokemon/pikachu \
  -H "X-API-Key: mf_live_YOUR_KEY_HERE"
```

---

## Tech Stack

| Layer              | Technology                        | Why                                                    |
|--------------------|-----------------------------------|--------------------------------------------------------|
| **Frontend**       | React 18 + Vite                   | Fast HMR, component model, ecosystem                   |
| **UI / Styling**   | Tailwind CSS + Recharts           | Utility-first CSS, chart library for analytics         |
| **State**          | Zustand + React Query             | Lightweight global state + server state with caching   |
| **Backend**        | Node.js + Express.js              | Non-blocking I/O ideal for a high-throughput gateway   |
| **Database**       | MongoDB Atlas (Mongoose)          | Flexible schema, horizontal scale, TTL indexes         |
| **Cache**          | Redis (ioredis)                   | Sub-millisecond rate limit counters                    |
| **Real-time**      | Socket.io                         | Push live request events to dashboard                  |
| **Scheduling**     | node-cron                         | Monthly invoice generation on the 1st                  |
| **Auth**           | JWT (access + refresh tokens)     | Stateless, short-lived access tokens, rotation         |
| **Gateway Proxy**  | http-proxy-middleware             | Low-overhead HTTP proxying                             |
| **Logging**        | Winston + Morgan                  | Structured logs to file + console                      |
| **Security**       | bcryptjs, helmet, cors            | Password hashing, security headers, CORS control       |

---

## System Architecture

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           METERFLOW PLATFORM                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                        FRONTEND  (port 3000)                        │   ║
║   │                                                                     │   ║
║   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   ║
║   │  │Dashboard │  │ API Keys │  │ Billing  │  │   Playground     │   │   ║
║   │  │(charts,  │  │(generate │  │(usage,   │  │(test gateway     │   │   ║
║   │  │ live feed│  │ revoke,  │  │ invoices,│  │ requests with    │   │   ║
║   │  │ counters)│  │ rotate)  │  │ plans)   │  │ body editor)     │   │   ║
║   │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │   ║
║   │       │              │              │                  │             │   ║
║   │       └──────────────┴──────────────┴──────────────────┘            │   ║
║   │                            React Query + Axios                       │   ║
║   │                       (auto-retry, caching, stale-while-revalidate) │   ║
║   └───────────────────────────────────┬─────────────────────────────────┘   ║
║                                       │  HTTP + WebSocket                   ║
║                                       ▼                                      ║
║   ┌───────────────────────────────────────────────────────────────────────┐  ║
║   │                    BACKEND  (port 5000 — Express.js)                  │  ║
║   │                                                                       │  ║
║   │   ┌─────────────────────┐        ┌───────────────────────────────┐   │  ║
║   │   │   REST API  /api/*  │        │   GATEWAY  /gateway/*         │   │  ║
║   │   │                     │        │                               │   │  ║
║   │   │  /auth   /apis      │        │  1. Parse X-API-Key header    │   │  ║
║   │   │  /keys   /billing   │        │  2. Validate key (DB lookup)  │   │  ║
║   │   │  /usage  /analytics │        │  3. Rate limit (Redis/memory) │   │  ║
║   │   │  /webhooks          │        │  4. Check monthly quota       │   │  ║
║   │   │                     │        │  5. Proxy → upstream API      │   │  ║
║   │   │  JWT Auth Middleware│        │  6. Log to MongoDB            │   │  ║
║   │   └──────────┬──────────┘        │  7. Emit Socket.io event      │   │  ║
║   │              │                   └──────────────┬────────────────┘   │  ║
║   │              │                                  │                     │  ║
║   │   ┌──────────▼──────────────────────────────────▼────────────────┐   │  ║
║   │   │              Socket.io (real-time broadcast)                  │   │  ║
║   │   │         emits 'new-request' on every gateway hit              │   │  ║
║   │   └───────────────────────────────────────────────────────────────┘   │  ║
║   │                                                                       │  ║
║   │   ┌─────────────────────┐   ┌─────────────────────────────────────┐   │  ║
║   │   │  node-cron (billing)│   │  Webhook Service                    │   │  ║
║   │   │  Runs 1st of month  │   │  Fires POST to registered URLs for: │   │  ║
║   │   │  - aggregate usage  │   │  - usage.limit.warning (80%)        │   │  ║
║   │   │  - calculate cost   │   │  - usage.limit.exceeded (100%)      │   │  ║
║   │   │  - create Invoice   │   │  - billing.invoice.created          │   │  ║
║   │   └─────────────────────┘   │  - api.key.created / revoked        │   │  ║
║   │                              └─────────────────────────────────────┘   │  ║
║   └──────────────┬────────────────────────────┬──────────────────────────┘  ║
║                  │                            │                              ║
║       ┌──────────▼──────────┐    ┌────────────▼────────────┐                ║
║       │  MongoDB Atlas      │    │  Redis                  │                ║
║       │                     │    │                         │                ║
║       │  Collections:       │    │  Keys:                  │                ║
║       │  • users            │    │  • ratelimit:{keyId}    │                ║
║       │  • apis             │    │  • ratelimit:{userId}   │                ║
║       │  • apikeys          │    │                         │                ║
║       │  • usagelogs        │    │  Fallback: in-memory    │                ║
║       │  • invoices         │    │  Map when Redis is      │                ║
║       │  • webhooks         │    │  unavailable            │                ║
║       │                     │    │                         │                ║
║       │  TTL index: logs     │    └─────────────────────────┘                ║
║       │  auto-delete 90d    │                                                ║
║       └─────────────────────┘                                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Data Flow Diagrams

### 1. Gateway Request Flow

```
Consumer App / cURL
        │
        │  GET /gateway/products
        │  X-API-Key: mf_live_abc123...
        │
        ▼
┌───────────────────────────────────────────────────────┐
│              MeterFlow Gateway Middleware              │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Step 1 — Extract & Validate Key                │  │
│  │                                                 │  │
│  │  Parse header → lookup ApiKey in MongoDB        │  │
│  │  • key not found         → 401 Unauthorized     │  │
│  │  • key status = revoked  → 403 Forbidden        │  │
│  │  • key expired           → 403 Forbidden        │  │
│  └─────────────────┬───────────────────────────────┘  │
│                    │ key is valid                      │
│  ┌─────────────────▼───────────────────────────────┐  │
│  │  Step 2 — Rate Limiting                         │  │
│  │                                                 │  │
│  │  INCR ratelimit:{keyId} in Redis (TTL 60s)      │  │
│  │  • count > requestsPerMinute → 429 Too Many     │  │
│  │  Set headers:                                   │  │
│  │    X-RateLimit-Limit: 60                        │  │
│  │    X-RateLimit-Remaining: 43                    │  │
│  └─────────────────┬───────────────────────────────┘  │
│                    │ within limits                     │
│  ┌─────────────────▼───────────────────────────────┐  │
│  │  Step 3 — Monthly Quota Check                   │  │
│  │                                                 │  │
│  │  Query UsageLog for current billingPeriod       │  │
│  │  • count >= planLimit → 429 Quota Exceeded      │  │
│  └─────────────────┬───────────────────────────────┘  │
│                    │ quota ok                          │
│  ┌─────────────────▼───────────────────────────────┐  │
│  │  Step 4 — Proxy to Upstream API                 │  │
│  │                                                 │  │
│  │  http-proxy-middleware forwards request to      │  │
│  │  Api.baseUrl (e.g. https://dummyjson.com)       │  │
│  │  Records start timestamp                        │  │
│  └─────────────────┬───────────────────────────────┘  │
│                    │ upstream responds                  │
│  ┌─────────────────▼───────────────────────────────┐  │
│  │  Step 5 — Log & Broadcast                       │  │
│  │                                                 │  │
│  │  Save UsageLog to MongoDB:                      │  │
│  │    { apiKeyId, apiId, endpoint, method,         │  │
│  │      statusCode, latency, ip, billingPeriod }   │  │
│  │                                                 │  │
│  │  socket.io.emit('new-request', logEntry)        │  │
│  │    → Dashboard live activity feed updates       │  │
│  │                                                 │  │
│  │  Increment Api.totalRequests counter            │  │
│  │  Update ApiKey.lastUsedAt, totalRequests        │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
        │
        │  HTTP Response + X-MeterFlow-* headers
        ▼
Consumer App
```

### 2. Authentication Flow

```
 Browser                     Backend                       MongoDB
    │                           │                              │
    │── POST /api/auth/login ──►│                              │
    │   { email, password }     │── findOne({ email }) ───────►│
    │                           │◄─ User document ─────────────│
    │                           │                              │
    │                           │  bcrypt.compare(password)    │
    │                           │  ✓ match                     │
    │                           │                              │
    │                           │  Sign accessToken  (15 min)  │
    │                           │  Sign refreshToken (7 days)  │
    │                           │  Store refreshToken in User  │
    │                           │── save() ───────────────────►│
    │                           │                              │
    │◄─ 200 OK ─────────────────│
    │   { accessToken,          │
    │     refreshToken,         │
    │     user }                │
    │                           │
    │  Zustand stores tokens    │
    │  in localStorage          │
    │                           │
    │── GET /api/analytics ────►│
    │   Authorization: Bearer   │  JWT middleware verifies
    │   <accessToken>           │  signature + expiry
    │                           │── findById(user.id) ────────►│
    │◄─ 200 analytics data ─────│◄─ User ──────────────────────│
    │                           │
    │   (15 min later)          │
    │── POST /api/auth/refresh ►│
    │   { refreshToken }        │  Verify refresh token
    │                           │  Issue new accessToken
    │                           │  Rotate refreshToken
    │◄─ { new accessToken } ────│
```

### 3. Billing Cycle

```
  Day 1 of Month — node-cron fires
          │
          ▼
  ┌────────────────────────────────────────────────┐
  │  billingCron.generateMonthlyInvoices()         │
  │                                                │
  │  1. Find all active Users                      │
  │  2. For each user:                             │
  │     a. Aggregate UsageLogs for last month      │
  │        GROUP BY apiId → totalRequests          │
  │     b. Apply pricing tiers per plan            │
  │        free:       ₹0 (up to 1,000 req)        │
  │        pro:        ₹0.005 / request            │
  │        enterprise: ₹0.001 / request            │
  │     c. Create Invoice document                 │
  │        { lineItems, subtotal, tax, total }     │
  │     d. Mark UsageLogs as isBilled = true       │
  │     e. Fire webhook: billing.invoice.created   │
  └────────────────────────────────────────────────┘
          │
          ▼
  Invoice visible in /billing page
  (status: open → paid on payment)
```

---

## Project Structure

```
meterflow/
├── backend/
│   ├── config/
│   │   ├── database.js          MongoDB connection (Mongoose)
│   │   └── redis.js             Redis client + in-memory fallback
│   ├── controllers/
│   │   ├── authController.js    Register, login, refresh, profile
│   │   ├── apiController.js     CRUD for API configurations
│   │   ├── apiKeyController.js  Generate, revoke, rotate keys
│   │   ├── billingController.js Usage summary, invoices, plan upgrade
│   │   └── analyticsController.js Dashboard stats aggregation
│   ├── middleware/
│   │   ├── auth.js              JWT verification, attach req.user
│   │   ├── gateway.js           Core gateway: validate → rate limit → proxy → log
│   │   └── errorHandler.js      Global error handler, AppError class
│   ├── models/
│   │   ├── User.js              Credentials, plan, planLimits, tokens
│   │   ├── Api.js               Registered APIs with pricing + rate config
│   │   ├── ApiKey.js            Keys with hash storage, rotation support
│   │   ├── UsageLog.js          Per-request log with 90-day TTL index
│   │   ├── Invoice.js           Monthly billing records with line items
│   │   └── Webhook.js           Subscriber URLs and event filters
│   ├── routes/
│   │   ├── auth.js              /api/auth/*
│   │   ├── apis.js              /api/apis/*
│   │   ├── apiKeys.js           /api/keys/*
│   │   ├── billing.js           /api/billing/*
│   │   ├── analytics.js         /api/analytics/*
│   │   ├── usage.js             /api/usage/*
│   │   └── webhooks.js          /api/webhooks/*
│   ├── services/
│   │   ├── billingService.js    Cost calculation, invoice generation
│   │   ├── billingCron.js       Monthly cron job (node-cron)
│   │   └── webhookService.js    Deliver webhook payloads with HMAC signature
│   ├── utils/
│   │   ├── logger.js            Winston logger (console + file)
│   │   └── seed.js              Creates demo + admin accounts
│   ├── logs/
│   │   ├── combined.log         All logs
│   │   └── error.log            Error-level only
│   ├── server.js                App bootstrap, middleware chain
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       └── DashboardLayout.jsx  Collapsible sidebar, header, nav
    │   ├── pages/
    │   │   ├── LoginPage.jsx            Split-panel login with demo fill
    │   │   ├── RegisterPage.jsx         Registration with free plan perks
    │   │   ├── DashboardPage.jsx        Animated counters, charts, live feed
    │   │   ├── ApisPage.jsx             API card grid with category filters
    │   │   ├── ApiDetailPage.jsx        Per-API stats, keys, top endpoints
    │   │   ├── ApiKeysPage.jsx          Key table, generate/revoke/rotate
    │   │   ├── BillingPage.jsx          Usage gauge, plan cards, invoices
    │   │   ├── UsagePage.jsx            Log table with method/latency colors
    │   │   ├── PlaygroundPage.jsx       Request builder with body editor
    │   │   └── SettingsPage.jsx         Profile, password, danger zone
    │   ├── services/
    │   │   └── api.js                   Axios instance with interceptors
    │   ├── store/
    │   │   └── authStore.js             Zustand: user, tokens, persist
    │   ├── App.jsx                      React Router routes + guards
    │   ├── main.jsx                     ReactDOM render, QueryClient
    │   └── index.css                    Design system (buttons, cards, badges)
    ├── tailwind.config.js               Custom colors, shadows, animations
    └── vite.config.js                   Dev proxy: /api + /gateway → :5000
```

---

## Database Schema

### Collections Overview

```
┌─────────────┐       ┌────────────────┐       ┌───────────────┐
│    users    │  1:N  │      apis      │  1:N  │   apikeys     │
│─────────────│──────►│────────────────│──────►│───────────────│
│ _id         │       │ _id            │       │ _id           │
│ email       │       │ userId  ───────┘       │ apiId  ───────┘
│ password    │       │ name           │       │ userId        │
│ plan        │       │ baseUrl        │       │ key (hashed)  │
│ planLimits  │       │ category       │       │ keyPrefix     │
│ role        │       │ rateLimit      │       │ status        │
│ refreshTokens│      │ pricing        │       │ environment   │
└──────┬──────┘       │ status         │       │ totalRequests │
       │              └────────────────┘       └───────┬───────┘
       │                                               │
       │  1:N                                     1:N  │
       ▼                                               ▼
┌─────────────┐                            ┌───────────────────┐
│  invoices   │                            │    usagelogs      │
│─────────────│                            │───────────────────│
│ _id         │                            │ _id               │
│ userId      │                            │ apiKeyId          │
│ billingPeriod│                           │ apiId             │
│ lineItems[] │                            │ userId            │
│ total       │                            │ endpoint          │
│ status      │                            │ method            │
└─────────────┘                            │ statusCode        │
                                           │ latency           │
┌─────────────┐                            │ billingPeriod     │
│  webhooks   │                            │ createdAt (TTL 90d│
│─────────────│                            └───────────────────┘
│ _id         │
│ userId      │
│ url         │
│ events[]    │
│ secret      │
└─────────────┘
```

### Key Index Strategy

| Collection  | Index                               | Purpose                           |
|-------------|-------------------------------------|-----------------------------------|
| usagelogs   | `{ userId, createdAt: -1 }`        | Dashboard queries by user         |
| usagelogs   | `{ apiId, createdAt: -1 }`         | Per-API stats                     |
| usagelogs   | `{ billingPeriod, userId }`        | Monthly billing aggregation       |
| usagelogs   | `{ createdAt: 1 }` TTL 90 days     | Auto-delete old logs              |
| apikeys     | `{ key: 1 }` unique                | O(1) gateway key lookup           |
| apikeys     | `{ apiId, status }`                | Active keys per API               |

---

## API Reference

### Authentication
| Method | Endpoint                      | Auth | Description                     |
|--------|-------------------------------|------|---------------------------------|
| POST   | `/api/auth/register`          | —    | Create account                  |
| POST   | `/api/auth/login`             | —    | Sign in, get tokens             |
| POST   | `/api/auth/refresh`           | —    | Rotate access + refresh token   |
| POST   | `/api/auth/logout`            | JWT  | Invalidate refresh token        |
| GET    | `/api/auth/me`                | JWT  | Get current user                |
| PATCH  | `/api/auth/profile`           | JWT  | Update name / company           |
| PATCH  | `/api/auth/change-password`   | JWT  | Change password                 |

### APIs
| Method | Endpoint                      | Auth | Description                     |
|--------|-------------------------------|------|---------------------------------|
| GET    | `/api/apis`                   | JWT  | List user's APIs                |
| POST   | `/api/apis`                   | JWT  | Create new API                  |
| GET    | `/api/apis/:id`               | JWT  | Get API details                 |
| PATCH  | `/api/apis/:id`               | JWT  | Update API config               |
| DELETE | `/api/apis/:id`               | JWT  | Deprecate API + revoke keys     |
| GET    | `/api/apis/:id/stats`         | JWT  | 24h + 7-day stats, top endpoints|

### API Keys
| Method | Endpoint                      | Auth | Description                     |
|--------|-------------------------------|------|---------------------------------|
| GET    | `/api/keys`                   | JWT  | List keys (filter: apiId, status)|
| POST   | `/api/keys`                   | JWT  | Generate key (returns full key once) |
| POST   | `/api/keys/:id/revoke`        | JWT  | Permanently revoke key          |
| POST   | `/api/keys/:id/rotate`        | JWT  | Issue new key, revoke old       |

### Billing
| Method | Endpoint                      | Auth | Description                     |
|--------|-------------------------------|------|---------------------------------|
| GET    | `/api/billing/plans`          | —    | List available plans            |
| GET    | `/api/billing/usage`          | JWT  | Current period usage + cost     |
| GET    | `/api/billing/invoices`       | JWT  | Invoice history                 |
| GET    | `/api/billing/invoices/:id`   | JWT  | Invoice detail with line items  |
| POST   | `/api/billing/upgrade`        | JWT  | Change plan                     |

### Analytics & Usage
| Method | Endpoint                      | Auth | Description                     |
|--------|-------------------------------|------|---------------------------------|
| GET    | `/api/analytics/dashboard`    | JWT  | Dashboard summary stats         |
| GET    | `/api/usage/logs`             | JWT  | Paginated request logs          |
| GET    | `/api/usage/traffic`          | JWT  | Traffic breakdown by API        |

### Gateway
| Method | Endpoint    | Auth       | Description                              |
|--------|-------------|------------|------------------------------------------|
| ANY    | `/gateway/*`| X-API-Key  | Proxy to upstream API + meter + log      |

**Gateway Headers returned:**
```
X-RateLimit-Limit:       60
X-RateLimit-Remaining:   43
X-RateLimit-Reset:       1716290460
X-MeterFlow-Latency:     124
X-MeterFlow-RequestId:   64f3a1...
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works) — or local MongoDB
- Redis (optional — app falls back to in-memory automatically)

### 1. Clone and install

```bash
git clone <repo>
cd meterflow

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment

**`backend/.env`**
```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/meterflow

JWT_SECRET=change_this_to_a_random_64_char_string
JWT_REFRESH_SECRET=another_random_64_char_string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379

FRONTEND_URL=http://localhost:3000
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GATEWAY_URL=http://localhost:5000/gateway
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed the database (demo data)

```bash
cd backend
npm run seed
```

Creates two accounts:
- `demo@meterflow.dev` / `Demo123!` — regular user with sample APIs
- `admin@meterflow.dev` / `Admin123!` — admin role

### 4. Start both servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# ✅ MeterFlow server running on port 5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# ✅ Local: http://localhost:3000
```

---

## Verification Checklist

Run through these after startup to confirm every feature works end-to-end:

### Backend health
```bash
# Should return { status: "ok", ... }
curl http://localhost:5000/health
```

### Authentication
- [ ] Visit `http://localhost:3000/login`
- [ ] Click **"Use demo credentials"** → Sign In
- [ ] Should redirect to `/dashboard`
- [ ] Dashboard counters animate on load (0 → value)

### APIs page
- [ ] Navigate to **My APIs** — should load (even empty is fine)
- [ ] Click **Add API** → select "⚡ PokéAPI" preset → Create API
- [ ] Card appears in grid with hover glow effect

### API Keys
- [ ] Navigate to **API Keys** → **Generate Key**
- [ ] Select the API, give it a name, choose Live environment
- [ ] Green banner appears showing the full key (one-time reveal)
- [ ] Copy the key — you'll need it for the gateway test
- [ ] Rotate button: click ↺ — new key banner appears

### Gateway test
```bash
# Replace with your actual key from the step above
curl -X GET http://localhost:5000/gateway/products \
  -H "X-API-Key: mf_live_YOUR_KEY_HERE"

# Expected: JSON response from DummyJSON + X-RateLimit-* headers
```

- [ ] After the request, navigate to **Usage & Logs** — the request appears
- [ ] Navigate to **Dashboard** — request counter increments

### Billing page
- [ ] Navigate to **Billing** — usage gauge shows current month
- [ ] Plan cards render (Free / Pro / Enterprise)
- [ ] Click **Upgrade to Pro** — badge in header updates immediately

### Playground
- [ ] Navigate to **Playground**
- [ ] Select an API and toggle **"Enter key manually"**
- [ ] Paste your API key, set endpoint to `/products/1`, method GET
- [ ] Click **Send Request** — JSON response appears with syntax highlighting
- [ ] Change method to POST — body textarea appears
- [ ] cURL snippet updates in real time as you type

### Settings
- [ ] Navigate to **Settings** — avatar shows your initials
- [ ] Update your name → Save Changes → green confirmation
- [ ] Password strength meter works when typing new password

### Real-time (optional)
- [ ] Open Dashboard in one tab
- [ ] Run the `curl` gateway command in a terminal
- [ ] Activity feed in Dashboard updates without page refresh

---

## Key Design Decisions

### Why proxy-based gateway instead of SDK?
A gateway requires zero changes to the upstream API. Consumers just swap their base URL to `localhost:5000/gateway` and add `X-API-Key`. No SDK to integrate, no library version to manage.

### Why Redis for rate limiting with in-memory fallback?
Redis gives microsecond counter increments that survive across server restarts and multiple instances. The in-memory fallback means the app stays fully functional without Redis — only multi-instance deployments need it.

### Why TTL index on UsageLog (90 days)?
Usage logs are high-volume (one document per request). A TTL index automatically deletes old logs without any cron or manual cleanup, keeping storage costs flat at scale.

### Why store the key hash, not the full key?
The full API key is shown once (at creation). MongoDB stores a SHA-256 hash. Even if the database is compromised, no API keys are exposed. The gateway validates by hashing the incoming key and comparing.

### Why JWT with refresh token rotation?
Access tokens expire in 15 minutes — short enough that a stolen token is useless quickly. Refresh tokens rotate on every use: if a stolen refresh token is used, the legitimate user's next refresh will fail, alerting the system.

### Why Zustand over Redux?
For a dashboard app with user auth state and a few UI flags, Zustand is a fraction of the boilerplate of Redux while supporting the same patterns. React Query handles all server state (caching, revalidation) so there's very little that needs global client state.

---

## Plans & Pricing

| Feature                | Free        | Pro             | Enterprise       |
|------------------------|-------------|-----------------|------------------|
| Requests / month       | 1,000       | 100,000         | 10,000,000       |
| Requests / minute      | 60          | 600             | 6,000            |
| APIs allowed           | 3           | 20              | Unlimited        |
| Analytics retention    | 7 days      | 30 days         | 1 year           |
| Webhooks               | —           | ✓               | ✓                |
| Custom domain          | —           | —               | ✓                |
| Support                | Community   | Email           | Dedicated        |
| Price                  | ₹0          | ₹999/month      | ₹4,999/month     |
| Overage                | —           | ₹0.50/100 req   | ₹0.10/100 req    |

---

## License

MIT — Portfolio project. Not intended for production use without Stripe integration.
