# Mechanic Marketplace App — Full Summary

## What This App Is
An Uber/DoorDash-style mobile app for auto repair. Customers post vehicle problems, nearby mechanics see the job, submit quotes, customer picks one, mechanic comes to them, payment is handled in-app including NFC tap-to-pay on iPhone.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Auth | JWT (access 15min + refresh 7 days) |
| Payments | Stripe Connect + Stripe Terminal (NFC tap-to-pay) |
| Maps | react-native-maps (Google Maps) |
| Real-time | Socket.io |
| Push Notifications | Expo Push API |
| State Management | Zustand + React Query |
| Navigation | Expo Router (file-based) |
| Storage | expo-secure-store (tokens), AsyncStorage (form drafts) |
| Build | EAS Build (Expo Application Services) |

---

## Folder Structure

```
Social-club-signupp/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   └── migrations/
└── frontend/
    ├── app/
    │   ├── (auth)/
    │   └── (tabs)/
    └── src/
        ├── screens/
        ├── services/
        └── hooks/
```

---

## User Roles

- **Customer** — posts service requests, gets quotes, tracks mechanic, pays
- **Mechanic** — sees nearby jobs, submits quotes, gets paid, uploads documents
- **Admin** — verifies mechanics, creates promo codes, manages platform

---

## Features Built

### Authentication
- Email/password login
- JWT access + refresh token rotation
- Forgot password (SHA-256 hashed reset token sent via email)
- Professional signup wizard (3-step, saves progress if you leave the app)
- Role-based access (customer / mechanic / admin)

### Customer Features
- Post a service request (vehicle + problem description + location)
- See quotes from nearby mechanics with name, rating, distance, price
- "Best Match" badge on top quote
- Book a mechanic
- Live map tracking of mechanic location
- ETA display
- In-app chat per job
- Job notes
- File a dispute
- View receipt after job (with PAID stamp, share button)
- Rate mechanic after job
- Re-book a mechanic

### Mechanic Features
- Dashboard with availability toggle (online/offline)
- See open service requests nearby
- Submit quotes on jobs
- Earnings screen (this month, total, jobs done, weekly chart, service breakdown)
- Document upload (insurance, ASE cert, license, other)
- Availability calendar (block off time slots)
- NFC tap-to-pay (iPhone) and card reader (Android)
- Job status updates with automatic push notifications to customer
- In-app chat per job
- Promo code entry screen (for beta testers)

### Admin Features
- Verify mechanic accounts
- Create bulk promo codes (format: BETA-XXXX-XXXX)
- List and delete promo codes

### Security
- Rate limiting on all API routes (auth: 5/15min, payments: 10/min)
- Helmet (security headers + HSTS)
- Input validation on all endpoints
- GPS location only broadcast to relevant job room (not all users)
- Stripe payment verified server-side before capture
- Race condition protection on promo code redemption (database row lock)
- Password reset tokens hashed with SHA-256 (never stored plain)
- Database SSL enforced in production
- CORS restricted to known frontend URL

### Real-time (Socket.io)
- Mechanic location updates → customer tracking screen
- Chat messages → both parties instantly
- Job status changes → push notification + socket event

### Push Notifications
- Mechanic accepted job
- Mechanic en route
- Mechanic arrived
- Job completed

---

## Screens

### Auth Screens
- `LoginScreen` — email/password, forgot password link, professional signup CTA
- `ForgotPasswordScreen` — 3 steps: enter email → enter code + new password → done
- `ProfessionalSignupScreen` — 3-step wizard (personal info → vehicle specialties → documents), saves draft to device

### Customer Screens
- `HomeScreen` — post service request
- `RequestDetailScreen` — quote cards, book mechanic
- `JobTrackingScreen` — live map, chat button, notes, dispute, receipt
- `ReceiptScreen` — styled receipt with PAID stamp, share button

### Mechanic Screens
- `MechanicDashboardScreen` — availability toggle, earnings summary, quick links, open requests
- `EarningsScreen` — stats, weekly bar chart, service breakdown
- `DocumentsScreen` — upload/delete documents
- `AvailabilityScreen` — block off time slots
- `PromoCodeScreen` — enter beta promo code

### Shared Screens
- `ChatScreen` — real-time chat bubbles per job

---

## Database Tables

- `users` — all users with role field
- `mechanics` — mechanic profile, location, verification status
- `vehicles` — customer vehicles
- `service_requests` — job postings
- `quotes` — mechanic quotes on jobs
- `jobs` — accepted jobs
- `payments` — payment records
- `reviews` — ratings after job
- `chat_messages` — per-job messages
- `push_tokens` — device tokens for notifications
- `mechanic_documents` — uploaded docs
- `availability_blocks` — blocked time slots
- `job_notes` — notes on a job
- `disputes` — filed disputes
- `password_reset_tokens` — hashed reset tokens
- `promo_codes` — beta access codes
- `promo_redemptions` — who redeemed what

---

## API Endpoints

| Group | Endpoints |
|-------|----------|
| Auth | register, login, refresh, logout, me, forgot-password, reset-password, register/professional |
| Vehicles | list, create, update, delete |
| Requests | list, get, create, update status |
| Mechanics | nearby, profile, update profile, update location, ETA, earnings |
| Jobs | list, get, status update |
| Payments | create intent, mechanic account, terminal capture |
| Reviews | submit, get for mechanic |
| Chat | get messages, send message |
| Push | register token, unregister token |
| Documents | list, upload, delete |
| Availability | list, create, delete |
| Disputes | file dispute |
| Job Notes | list, add |
| Promo | validate, redeem, create (admin), list (admin), delete (admin) |

---

## Deployment Plan

1. **Database** — PostgreSQL on Render.com (free tier)
2. **Backend** — Web Service on Render.com pointing to `/backend` folder
3. **Environment Variables needed:**
   - `DATABASE_URL` — from Render PostgreSQL
   - `JWT_SECRET` — random 40+ character string
   - `JWT_REFRESH_SECRET` — different random string
   - `STRIPE_SECRET_KEY` — from stripe.com dashboard
   - `STRIPE_WEBHOOK_SECRET` — from Stripe webhooks
   - `FRONTEND_URL` — your app's URL
   - `NODE_ENV=production`
4. **Frontend** — EAS Build → Android APK for testers
5. **Beta testers** — give them promo codes (BETA-XXXX-XXXX format)

---

## What's NOT Done Yet (Next Steps)

- Email service (need to wire up SendGrid or similar to actually send reset emails)
- Admin web dashboard (currently admin actions are API-only)
- Apple Pay / Google Pay full integration testing
- App Store submission (needs Apple Developer account $99/yr)
- Background location tracking when app is closed
- Stripe webhook endpoint for payment confirmation

---

## Git Branch
All code is on branch: `claude/new-session-3agm25`
Repo: `https://github.com/camcam7242/Social-club-signupp`
