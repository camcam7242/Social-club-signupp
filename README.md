# Mobile Mechanic Marketplace

Two-sided marketplace connecting customers with mobile mechanics for on-demand vehicle repair.

## Structure

```
├── backend/    # Express + TypeScript API
└── frontend/   # Expo React Native app
```

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in values
npm run migrate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npx expo start
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo / React Native (TypeScript) |
| API | Express + TypeScript |
| Database | PostgreSQL |
| Cache | Redis |
| Auth | JWT + Refresh Tokens |
| Payments | Stripe Connect |
| Storage | AWS S3 |
| Real-time | Socket.io |
| Maps | Google Maps API |
