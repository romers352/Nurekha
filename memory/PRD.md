# Nurekha — PRD (Product Requirements Document)

## Original Problem Statement
Build "Nurekha" — a multi-tenant AI chat automation SaaS for Nepal. Features include landing page, auth (login/signup/forgot-password), client dashboard, agent dashboard, channel connection, training, business chat, orders, billing, and settings. Design: premium white+black editorial with Instrument Serif + Geist fonts.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: JWT (access+refresh tokens, httpOnly cookies) + Emergent Google OAuth
- **Fonts**: Instrument Serif (display), Geist (body), Geist Mono (code)
- **Design System**: White #FFFFFF base, #0C0A09 text, #1C1917 accent, #E7E5E4 borders

## User Personas
1. **Nepali Business Owner** — wants to automate customer conversations across social channels
2. **Admin** — manages platform, billing, support tickets

## Core Requirements (Static)
- Landing page with sections: Navbar, Hero, Channel bar, Features, How it works, Business types, CTA, Footer
- Auth pages: Login, Signup, Forgot password, Reset password (JWT + Google OAuth)
- Client Dashboard: Overview, Agents, Billing, Support, Settings
- Agent Dashboard: Overview, Connect channels, Train agent, Business Chat, Data, Orders, Settings
- Payment integration: eSewa + Khalti (demo/test mode)
- Multi-channel support: Facebook, Instagram, WhatsApp, TikTok, Website widget

## What's Been Implemented
- **2026-02-20**: Landing Page (Phase 1) — Complete (98% test pass)
- **2026-02-20**: Auth System (Phase 2) — Complete (100% test pass)
  - Backend: JWT auth (register, login, logout, me, refresh, forgot-password, reset-password)
  - Backend: Emergent Google OAuth session exchange
  - Backend: Admin seeding, brute force protection, MongoDB indexes
  - Backend: Agent CRUD (create, list, get, delete) + Dashboard stats API
  - Frontend: AuthContext provider with 3 states (checking/auth/not-auth)
  - Frontend: ProtectedRoute, AuthCallback for Google OAuth
  - Frontend: Login page (2-column, dark left, form right, Google button)
  - Frontend: Signup page (Nepal +977 mobile, business type multi-select, password strength)
  - Frontend: Forgot Password page (centered card, success state, countdown)
  - Frontend: Reset Password page (token-based, strength bar)
- **2026-02-20**: Client Dashboard (Phase 3) — Complete (100% test pass)
  - ClientSidebar with collapse, active indicators, tooltips
  - TopBar with quota progress, notifications, avatar dropdown
  - MobileBottomNav for responsive
  - Dashboard Overview with stat cards, quick actions, agent table
  - Agents page with create dialog, delete, empty state
  - Placeholder pages: Billing, Support, Settings

## Prioritized Backlog
### P0 (Next)
- Agent Dashboard Shell (sidebar + layout)
- Connect Channels page (5 channels)
- Train Agent page (Business Info, FAQs, Documents, Products)

### P1
- Business Chat page (conversations, messages, user profile)
- Orders page

### P2
- Billing page (eSewa + Khalti integration)
- Support/Settings full implementation

## Next Tasks
1. Build Agent Dashboard shell (AgentSidebar, AgentLayout)
2. Connect Channels page (Facebook, Instagram, WhatsApp, TikTok, Website widget)
3. Train Agent page (Business Info form, FAQ manager, Document uploader, Product table)
