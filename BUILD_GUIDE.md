# How to Build & Share the App

## Step 1 — One-time setup (do this once on your computer)

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to Expo (create free account at expo.dev if you don't have one)
eas login

# Clone the repo
git clone https://github.com/camcam7242/Social-club-signupp
cd Social-club-signupp/frontend
npm install
```

## Step 2 — Link your Expo account to the project

```bash
eas init
# It will ask to create a new project — say Yes
# Copy the projectId it gives you and paste it into app.json under extra.eas.projectId
```

## Step 3 — Set your environment variables

Edit `eas.json` and replace these placeholders in the "preview" section:
- `your-backend-url.com` → your actual backend server URL
- `pk_test_your_key_here` → your Stripe publishable test key (from stripe.com dashboard)

## Step 4 — Build the Android APK (testers can install this directly)

```bash
eas build --platform android --profile preview
```

- Takes about 10-15 minutes
- When done, EAS gives you a download link
- Send that link to your beta mechanic testers
- They open it on their Android phone → tap Install → done

## Step 5 — Build for iPhone (needs Apple Developer account — $99/yr)

```bash
eas build --platform ios --profile preview
```

**Free alternative for iPhone:** Use the `development` profile with Expo Go instead:
```bash
eas build --platform ios --profile development
# Then testers install Expo Go and scan the QR from expo.dev
```

## Step 6 — Share with testers

After the build finishes:
1. Go to **expo.dev** → your project → Builds
2. Click the build → "Share" → copy the install link
3. Send that link to your mechanics — they tap it, install, done

## Promo Codes for Beta Testers

Once your backend is running, create codes for your mechanics:

```bash
curl -X POST https://your-backend.com/api/promo/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 20,
    "prefix": "BETA",
    "description": "Early mechanic beta tester — free access",
    "type": "free_access",
    "expires_days": 90
  }'
```

This returns 20 codes like `BETA-A3F7-2B9C` that mechanics enter after signing up.

## Backend Deployment (Render.com — free tier)

1. Go to render.com → New → Web Service → connect your GitHub repo
2. Set root directory: `backend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables (DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, etc.)
6. Deploy → copy the URL → paste it into eas.json as your API URL
