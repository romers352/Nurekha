# Nurekha — PRD

## Architecture
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: FastAPI + MongoDB + WebSocket
- **Auth**: JWT + Emergent Google OAuth
- **Payments**: eSewa (sandbox) + Khalti (sandbox)
- **Design**: White+Black editorial, Instrument Serif + Geist

## What's Been Implemented

### Phase 1 - Landing Page ✅
### Phase 2 - Auth + Client Dashboard ✅
### Phase 3 - Agent Dashboard + Channels + Training + Chat ✅
### Phase 4 - Billing + Orders + WebSocket ✅
- Billing: 3 plans (Free/Pro/Enterprise), eSewa + Khalti test integration, payment history
- Orders: Full CRUD with status workflow (pending→confirmed→processing→shipped→delivered), create order with items/payment/delivery
- WebSocket: Real-time messaging with connection status indicator

## Backlog
### P0
- Admin panel
- WhatsApp Business API real integration
### P1
- Analytics dashboard with Recharts
- File upload with object storage
- Email notifications (SendGrid/Resend)
### P2
- Multi-language support (Nepali)
- Mobile PWA
