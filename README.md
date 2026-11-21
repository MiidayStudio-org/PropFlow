# 🏢 PropFlow — Open-Source AI-Powered Real Estate Operating System & CRM

<p align="center">
  <img src="frontend/public/logo.svg" alt="PropFlow Logo" width="120" />
</p>

<p align="center">
  <strong>Next-Generation CRM, Property Portal Scraper Engine & AI Matching Platform for Modern Real Estate Agencies, Brokers, and Property Developers.</strong>
</p>

<p align="center">
  <a href="https://github.com/MiidayStudio-org/PropFlow/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://github.com/MiidayStudio-org/PropFlow/issues"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
  <a href="https://github.com/MiidayStudio-org/PropFlow/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"><img src="https://img.shields.io/badge/good%20first%20issue-ready-orange.svg" alt="Good First Issue" /></a>
  <img src="https://img.shields.io/badge/Next.js-16%20App%20Router-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/PostgreSQL-18-blue?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-5.22-teal?logo=prisma" alt="Prisma" />
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quickstart">Quickstart</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

---

## 🌟 Overview

**PropFlow** is an open-source, enterprise-grade Real Estate Operating System designed to replace fragmented spreadsheets, disconnected WhatsApp chats, and legacy expensive CRMs. It unifies:

- 🕷️ **Property Portal Scraper Engine** (Playwright automated ingestion & data normalizers)
- 🤖 **AI Lead-to-Property MatchEngine** (Budget, BHK, and locality multi-factor scoring)
- 🎯 **Leads & Buyers Pipeline CRM** (High/Medium/Low intent categorization)
- 🏙️ **Live Property Inventory Management** (Real PostgreSQL backing, zero dummy fallbacks)
- 📅 **Site Visit Logistics Dispatcher** (Physical inspection scheduling)
- 🤝 **Deal Pipeline & Brokerage Commission Ledger** (Negotiation stages & revenue tracking)
- 👥 **Multi-Tenant Agency Workspace & RBAC** (Role-based access & team management)
- 🔐 **Official Google OAuth 2.0 & JWT Sessions**

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [Next.js 16 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | Official Google OAuth 2.0 + HMAC SHA-256 JWT Sessions |
| **Scraper Engine** | [Playwright](https://playwright.dev/), [Cheerio](https://cheerio.js.org/) |

---

## 🚀 Quickstart

### 1. Clone the repository
```bash
git clone https://github.com/MiidayStudio-org/PropFlow.git
cd PropFlow
```

### 2. Configure Backend & Database
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/PropFlow_db?schema=public"
NODE_ENV="development"
PORT=5000
FRONTEND_ORIGIN="http://localhost:3000"
JWT_SECRET="your-secure-jwt-secret"
ENABLE_SCRAPE_CRON="false"

# Google OAuth 2.0 (from Google Cloud Console)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
```

Push database schema to PostgreSQL:
```bash
npx prisma db push
npx prisma generate
```

Start the backend:
```bash
npm run dev
```

### 3. Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the landing page and CRM dashboard!

---

## 🤝 Contributing

We welcome contributors of all skill levels! Whether you want to improve UI/UX, write scraper modules, integrate LLM APIs, or optimize database queries, we would love your help.

1. Read our **[CONTRIBUTING.md](./CONTRIBUTING.md)** guide.
2. Browse open issues on our **[Issue Tracker](https://github.com/MiidayStudio-org/PropFlow/issues)**.
3. Look for the [`good first issue`](https://github.com/MiidayStudio-org/PropFlow/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) tag if you're new!
4. Fork the repo, make your changes, and submit a PR!

---

## 📄 License

PropFlow is open-source software licensed under the [MIT License](LICENSE).
