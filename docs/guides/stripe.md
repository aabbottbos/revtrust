# Stripe Integration Setup Guide

This guide will help you set up Stripe for RevTrust's subscription payments.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Backend and frontend development environments set up
- Access to your .env files

## Step 1: Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Complete the signup process
3. **Switch to Test Mode** using the toggle in the top right corner

## Step 2: Get API Keys

1. Navigate to **Developers → API Keys** in your Stripe Dashboard
2. Copy the following keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

### Add to Backend `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### Add to Frontend `.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

## Step 3: Create Product and Price

1. In Stripe Dashboard, go to **Products → Add Product**
2. Fill in the details:
   - **Name:** RevTrust Pro
   - **Description:** AI-powered pipeline intelligence
   - **Pricing Model:** Recurring
   - **Price:** $59.00 USD
   - **Billing Period:** Monthly
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`)

### Add to Backend `.env`:
```bash
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
```

## Step 4: Set Up Webhook

### For Local Development (Recommended: Stripe CLI)

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   # Download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local backend:**
   ```bash
   stripe listen --forward-to localhost:8000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** from the output (starts with `whsec_`)

### Add to Backend `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### For Production (Stripe Dashboard)

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your production endpoint URL:
   ```
   https://your-backend-url.com/api/webhooks/stripe
   ```
4. Select the following events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 5: Configure Frontend URL

Add to Backend `.env`:
```bash
FRONTEND_URL=http://localhost:3000
# For production: FRONTEND_URL=https://your-frontend-url.com
```

## Step 6: Test the Integration

### Test Cards (Test Mode Only)

Use these test cards in Stripe Checkout:

| Card Number         | Description              |
|---------------------|--------------------------|
| 4242 4242 4242 4242 | Successful payment       |
| 4000 0000 0000 0002 | Declined payment         |
| 4000 0025 0000 3155 | Requires authentication  |

- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### Testing Flow

1. Start your backend server:
   ```bash
   cd backend
   poetry run uvicorn app.main:app --reload
   ```

2. Start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:8000/api/webhooks/stripe
   ```

3. Start your frontend:
   ```bash
   cd frontend
   npm run dev
   ```

4. Test the complete flow:
   - Go to http://localhost:3000/pricing
   - Click "Start Pro Trial"
   - Sign in if needed
   - Complete checkout with test card: `4242 4242 4242 4242`
   - Verify redirect to success page
   - Check that user is upgraded to Pro in database
   - Try running AI analysis (should work now!)
   - Go to /subscription to manage subscription
   - Click "Manage Subscription" to access Stripe portal

## Environment Variables Summary

### Backend `.env`
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Troubleshooting

### Checkout session fails to create
- Verify `STRIPE_SECRET_KEY` is set correctly
- Verify `STRIPE_PRO_PRICE_ID` is correct
- Check that keys are in test mode (start with `pk_test_` and `sk_test_`)

### Webhook not receiving events
- Ensure Stripe CLI is running: `stripe listen --forward-to localhost:8000/api/webhooks/stripe`
- Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output
- Check backend logs for webhook errors

### User not upgraded after payment
- Check webhook logs in terminal
- Verify `user_id` is in subscription metadata
- Check database connection in webhook handler
- Look for errors in backend terminal

### Portal session fails
- Verify user has `stripeCustomerId` in database
- Check that customer exists in Stripe Dashboard
- Ensure user completed at least one successful payment

## Production Deployment

1. **Switch to Live Mode** in Stripe Dashboard
2. Get your **live API keys**:
   - Live publishable key (starts with `pk_live_`)
   - Live secret key (starts with `sk_live_`)
3. Create a **production webhook endpoint** in Stripe Dashboard
4. Update environment variables with live keys
5. Test thoroughly before going live!

## Security Notes

- **Never commit** `.env` files to version control
- **Never expose** secret keys in client-side code
- Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secure
- Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` should be in frontend
- Verify webhook signatures to prevent fraud
- Use HTTPS in production

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli
- RevTrust Issues: [Your GitHub issues URL]
