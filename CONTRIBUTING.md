# Contributing to PropFlow 🚀

Thank you for your interest in contributing to **PropFlow**! We are building the open-source **AI-Powered Real Estate Operating System & CRM** designed for modern agencies, brokers, and developers.

Whether you are fixing a typo, resolving a bug, building a new scraper, or adding a full-stack feature, your contributions are warmly welcomed!

---

## 🧭 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful, constructive, and kind in all discussions, issues, and pull requests.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Official Google OAuth 2.0 & JWT Sessions
- **Scraper Engine**: Playwright, Cheerio, Regex Data Normalizers

---

## 🚀 Quickstart Local Development

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/PropFlow.git
cd PropFlow
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/PropFlow_db?schema=public"
PORT=5000
FRONTEND_ORIGIN="http://localhost:3000"
JWT_SECRET="your-jwt-secret"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
```

Push Prisma schema and generate client:
```bash
npx prisma db push
npx prisma generate
```

Start backend dev server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🏷️ Issue Labels Guide

- `good first issue`: Ideal for beginners or first-time contributors.
- `help wanted`: Features or bug fixes where community assistance is actively requested.
- `bug`: Something is not working as expected.
- `enhancement`: New feature or improvement to existing functionality.
- `frontend`: Issues touching Next.js, React components, Tailwind styling, or UI.
- `backend`: Issues touching Express routes, Prisma schema, or business logic.
- `ai`: Features involving AI Matching, natural language querying, or LLM integrations.
- `scraper`: Enhancements to property portal crawlers and data extraction pipelines.

---

## 📥 Submitting a Pull Request

1. **Find or create an issue** before writing code so we can discuss and align on the approach.
2. **Create a descriptive branch**:
   ```bash
   git checkout -b feat/whatsapp-cloud-api
   # or
   git checkout -b fix/mobile-nav-toggle
   ```
3. **Write clean, type-safe code**:
   - Run `npx tsc --noEmit` in both `frontend` and `backend`.
   - Run `npm test` in `backend`.
4. **Commit with conventional commit messages**:
   - `feat: add Google Calendar sync for site visits`
   - `fix: resolve deal pipeline calculation discrepancy`
   - `docs: update setup guide in README`
5. **Push and open a PR** against the `main` branch of `MiidayStudio-org/PropFlow`.
6. Fill out the PR template with a clear description and screenshots/recordings if applicable.

---

## 💬 Community & Help

Need help getting started or have questions? Open a GitHub Discussion or submit an issue!
