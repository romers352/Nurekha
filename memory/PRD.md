# Nurekha — PRD

## Architecture
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: FastAPI + MongoDB + WebSocket
- **Auth**: JWT + Emergent Google OAuth
- **Payments**: eSewa (sandbox) + Khalti (sandbox)

## All Implemented Pages

### Public Pages
- Landing Page (Navbar, Hero, Channels, Features, How It Works, Business Types, CTA, Footer)
- Pricing Page (credit-based: message packs + agent slots, FAQ section)
- Services Page (6 detailed service cards)
- Login, Signup, Forgot/Reset Password

### Client Dashboard
- Overview (stat cards, agent table, quick actions)
- My Agents (create/delete agents, card grid, empty state)
- Billing (credit-based: current usage, buy message packs, buy agent slots, payment history)
- Support (create/view/reply tickets, priority levels)
- Settings (Profile edit, Change password, Notification preferences)

### Agent Dashboard
- Overview (stats, quick actions)
- Connect Channels (5 channels: FB/IG/WA/TT/Website with connect/disconnect)
- Train Agent (5 tabs: Business Info, FAQs with CSV bulk import, Documents upload/scrape, Products with CSV bulk import + detailed form, Test Agent chat)
- Business Chat (3-panel: conversation list with filters, chat with WebSocket, user profile)
- Orders (full CRUD, status workflow, refund, create order dialog)
- Agent Settings (greeting/fallback messages, reply delay, handoff keywords, collect info toggle)
- Uploaded Data (placeholder)

## Backend Endpoints (50+)
Auth, Agents CRUD, Channels, Training (Business Info, FAQs, Documents, Products), Bulk Imports, Test Chat, Conversations, Messages, WebSocket, Billing/Credits, Orders with Refund, Support Tickets, User Profile
