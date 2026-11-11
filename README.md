# Xclusive Shop

React + Vite + Firebase (Firestore + Google Auth) online shop. The browser talks directly to Firestore — there is no backend server except a serverless email endpoint.

## Security Checklist (Firebase Console — manual steps)

1. **Publish Firestore Security Rules.** The rules you publish must match the data model this app uses (see "Firestore data model" below). The app does not create or manage rules for you.

2. **Enable Firebase App Check.** Go to Project Settings > App Check, register your web app with reCAPTCHA v3 (or reCAPTCHA Enterprise). Set the site key in `VITE_RECAPTCHA_SITE_KEY` in your `.env`. Enforce App Check on Firestore. For local development, set `VITE_APPCHECK_DEBUG_TOKEN` in `.env` and register the debug token in the Console.

3. **Restrict the Firebase API key.** In Google Cloud Console > APIs & Services > Credentials, edit your Firebase Browser key and restrict it to your production domain(s) under "Application restrictions". Under "API restrictions", limit it to the Firebase APIs you use (Identity Toolkit, Token Service, Cloud Firestore).

4. **Authorize domains.** In Firebase Console > Auth > Settings > Authorized domains, add your production domain(s). Remove `localhost` before going live.

5. **Set up budget alerts.** In Google Cloud Console > Billing, create budget alerts for your Firebase project so you are notified before quota overages.

6. **Configure the email endpoint.** Set `BREVO_API_KEY` and `ADMIN_EMAIL` as environment variables on your hosting platform (Vercel, Firebase Functions, etc.). The `api/send-order.js` endpoint sends order confirmation and status update emails via Brevo.

## Firestore data model

This app writes these collections:

- **products, categories, banners**: anyone reads, only admins write.
- **users/{uid}**: a user reads only their own doc (admins read all). Fields: `email`, `name`, `isAdmin` (boolean, must be false on create), `createdAt`. Only admins update or delete.
- **orders**: anyone creates. Fields: `customerName`, `customerEmail` (optional), `customerPhone`, `customerAddress`, `customerCity`, `paymentMethod` ("cod"), `notes` (optional), `items` (1–30), `total` (number > 0), `status` ("pending"), `userId` (null or signed-in uid), `createdAt` (serverTimestamp). Owners read only their own orders; admins read, update, delete all.
- **messages**: anyone creates with `name`, `email`, `phone` (optional), `message`, `createdAt` (serverTimestamp). Only admins read.
- **settings**: admin only (shipping configuration).

All other collections are locked. Cart and wishlist are stored in `localStorage` only — they never touch Firestore.

## Known Limitation

**Order prices cannot be fully verified by Firestore rules.** The client re-reads each product's current price from Firestore before submitting an order and computes the total from those prices. However, a sophisticated user could bypass the client and write arbitrary prices/total to the orders collection. The proper fix is a Cloud Function that creates orders server-side and computes the total from the products collection. This is the recommended next step.

**Rate limiting.** The app includes a client-side 30-second cooldown between order submissions (stored in `sessionStorage`). This is not a security measure — it can be bypassed. Real rate limiting requires a Cloud Function or Firebase Extensions (e.g., the Rate Limiting extension).

## Environment variables

Copy `.env.example` to `.env` and fill in your values. Never commit `.env`.

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key for App Check (optional in dev) |
| `VITE_APPCHECK_DEBUG_TOKEN` | App Check debug token (dev only, never in production) |

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
