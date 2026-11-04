# Vercel deployment

This repository is deployed as **two Vercel projects** because the frontend and backend are separate applications in the monorepo.

## 1. Backend project

Import this repository into Vercel and set:

- Root Directory: `backend`
- Framework Preset: Other / Express auto-detection
- Build Command: leave the detected/default value; no separate build is required
- Install Command: `npm install`
- Output Directory: leave empty

The Express app is exported from `server.js`. MongoDB connects lazily and reuses the connection while a Vercel function instance stays warm. The long-running membership timer is only started for local development; Vercel runs the membership task through the configured Cron endpoint.

Add these Environment Variables to the backend Vercel project:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your production MongoDB connection string |
| `JWT_ACCESS_SECRET` | A long, random secret |
| `JWT_REFRESH_SECRET` | A different long, random secret |
| `CLIENT_URL` | Exact deployed frontend origin, e.g. `https://your-gym-frontend.vercel.app` |
| `COOKIE_SAME_SITE` | `none` |
| `RAZORPAY_KEY_ID` | Authorized business account's key ID, when configured |
| `RAZORPAY_KEY_SECRET` | Authorized business account's secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured for the Razorpay webhook |
| `CRON_SECRET` | Long random secret |
| `DISABLE_IN_PROCESS_JOBS` | `true` |
| `SMTP_HOST` | SMTP host, if password-reset email is enabled |
| `SMTP_PORT` | SMTP port |
| `SMTP_SECURE` | `true` or `false`, as required by the SMTP provider |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | Verified sender address |

Do not commit real credentials to GitHub or put Razorpay secret values in frontend variables. Set sensitive values only in the Vercel backend project's Environment Variables.

Deploy the backend and copy its production URL.

## 2. Frontend project

Create a second Vercel project from the same GitHub repository and set:

- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Add this Environment Variable:

- `VITE_API_URL` = backend production URL followed by `/api`, for example `https://your-gym-backend.vercel.app/api`

Deploy the frontend and copy its exact production origin. Go back to the backend project's `CLIENT_URL` variable and set that exact origin. Redeploy the backend after changing it.

The `frontend/vercel.json` rewrite supports React Router deep links such as `/login` and `/admin/dashboard`.

## 3. MongoDB Atlas

Use a production database and a database user with only the permissions the application needs. Configure Atlas Network Access so Vercel functions can reach the cluster. Do not publish the database password.

## 4. Razorpay webhook

After the backend is deployed, configure the webhook URL as:

`https://YOUR-BACKEND-DOMAIN/api/payments/razorpay/webhook`

Subscribe to the payment events handled by this application, including `payment.captured` and `payment.failed`. Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET` in the backend project, then redeploy.

Use only credentials belonging to the gym business owner or another properly authorized adult representative. Keep the key secret on the backend.

## 5. Membership expiry schedule

The backend Cron is configured to run daily at 00:00 UTC (05:30 India time). Vercel Hobby permits daily Cron schedules; an hourly schedule would not deploy on Hobby. The endpoint is protected using `CRON_SECRET`.

## 6. Smoke tests after deployment

1. Open `https://YOUR-BACKEND-DOMAIN/api/health`; expect a successful response with database connected.
2. Open the frontend homepage and refresh a nested route directly.
3. Test registration, login, refresh, logout, and password reset email.
4. Test admin-only routes and the admission flow.
5. Test Razorpay only after the business owner's payment account and webhook are fully enabled.
6. Check Vercel Function Logs for backend runtime errors.

A successful Vercel deployment does not by itself certify the application as production-ready. Complete the smoke tests and payment reconciliation checks before taking real customer payments.
