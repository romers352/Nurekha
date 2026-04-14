# Nurekha — PRD

## Original Problem Statement
Build "Nurekha" — a multi-tenant AI chat automation SaaS for Nepal.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: JWT + Emergent Google OAuth
- **Design**: White #FFFFFF base, #0C0A09 text, #1C1917 accent, Instrument Serif + Geist fonts

## What's Been Implemented

### Phase 1 - Landing Page (Complete)
- Navbar, Hero, Channel Bar, Features Grid, How It Works, Business Types, CTA, Footer

### Phase 2 - Auth + Client Dashboard (Complete)
- JWT auth + Google OAuth, Login/Signup/Forgot/Reset password pages
- Client Dashboard with Sidebar, TopBar, Overview, Agents CRUD

### Phase 3 - Agent Dashboard + Channels + Training + Chat (Complete)
- Agent Dashboard shell with AgentSidebar (AI toggle, 7 nav items)
- Agent Overview with stat cards and quick actions
- Connect Channels (5 channels: Facebook, Instagram, WhatsApp, TikTok, Website)
- Train Agent (4 tabs: Business Info with hours/tone/language, FAQs CRUD, Documents upload/scrape, Products table)
- Business Chat (3-panel: conversation list with search/filters, chat window with messages/AI toggle, user profile)
- Backend: 25+ API endpoints for channels, training data, conversations, messages

## Prioritized Backlog
### P0 (Next)
- Billing page (eSewa + Khalti integration)
- Orders page (full implementation)
- Agent Settings page

### P1
- Real-time messaging via WebSocket
- File upload with object storage
- Order management workflow

### P2
- Admin panel
- Analytics dashboard with charts
- WhatsApp Business API integration
