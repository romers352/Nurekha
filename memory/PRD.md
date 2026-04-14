# Nurekha — PRD (Product Requirements Document)

## Original Problem Statement
Build "Nurekha" — a multi-tenant AI chat automation SaaS for Nepal. Features include landing page, auth (login/signup/forgot-password), client dashboard, agent dashboard, channel connection, training, business chat, orders, billing, and settings. Design: premium white+black editorial with Instrument Serif + Geist fonts.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Fonts**: Instrument Serif (display), Geist (body), Geist Mono (code)
- **Design System**: White #FFFFFF base, #0C0A09 text, #1C1917 accent, #E7E5E4 borders

## User Personas
1. **Nepali Business Owner** — wants to automate customer conversations across social channels
2. **Admin** — manages platform, billing, support tickets

## Core Requirements (Static)
- Landing page with sections: Navbar, Hero, Channel bar, Features, How it works, Business types, CTA, Footer
- Auth pages: Login, Signup, Forgot password, Reset password
- Client Dashboard: Overview, Agents, Billing, Support, Settings
- Agent Dashboard: Overview, Connect channels, Train agent, Business Chat, Data, Orders, Settings
- Payment integration: eSewa + Khalti (demo/test mode)
- Multi-channel support: Facebook, Instagram, WhatsApp, TikTok, Website widget

## What's Been Implemented
- **2026-02-20**: Landing Page (Phase 1) — Complete
  - Sticky Navbar with frosted glass effect
  - Hero section with dot grid background, Instrument Serif heading
  - Channel bar (5 channels)
  - Features grid (6 cards)
  - How it Works (4 steps)
  - Business types grid (9 types)
  - Dark CTA section
  - Footer with link columns
  - Mobile responsive with hamburger menu
  - Framer Motion animations throughout
  - All data-testid attributes present
  - Testing: 98% pass rate

## Prioritized Backlog
### P0 (Next)
- Auth pages (Signup, Login, Forgot Password, Reset Password)
- Backend auth APIs

### P1
- Client Dashboard Shell (Sidebar, TopBar, Layout)
- Dashboard Overview page
- Agents page (list + create)

### P2
- Agent Dashboard Shell
- Connect Channels page
- Train Agent page (Business Info, FAQs, Documents, Products)
- Business Chat page

### P3
- Orders page
- Billing page (eSewa + Khalti integration)
- Support/Settings pages

## Next Tasks
1. Build Auth pages (signup → login → forgot password)
2. Implement backend auth API (JWT + Google OAuth)
3. Build Client Dashboard layout and overview
