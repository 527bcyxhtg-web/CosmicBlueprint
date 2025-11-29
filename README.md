# 🌟 Cosmic Blueprint - Astrology E-Commerce Platform

## 🎯 Project Overview

Premium astrology reading service with **dual payment integration** (Stripe + Revolut).

### Key Features:
- ✅ **Stripe Checkout** - Global payment processing
- ✅ **Revolut Merchant API** - Lower fees (0.8% vs 1.4%)
- ✅ **Guest Checkout** - No login required
- ✅ **Cloudflare D1 Database** - Order tracking
- ✅ **Webhook Handling** - Automatic order completion
- ✅ **Multi-currency Support** - EUR, USD, GBP

---

## 💰 Payment Comparison

| Provider | Fee | €147 Package Cost |
|----------|-----|-------------------|
| **Revolut** | 0.8% + €0.02 | €1.18 |
| **Stripe** | 1.4% + €0.25 | €2.31 |
| **Savings** | - | **€1.13 per sale** |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd cosmic-blueprint
npm install
```

### 2. Configure Environment
Edit `.dev.vars`:
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Revolut
REVOLUT_API_KEY=sandbox_YOUR_KEY
REVOLUT_MERCHANT_ID=mer_YOUR_ID
```

### 3. Setup Database
```bash
npm run db:migrate:local
```

### 4. Build & Run
```bash
npm run build
pm2 start ecosystem.config.cjs
```

### 5. Test
```bash
curl http://localhost:3000
```

---

## 📁 Project Structure

```
cosmic-blueprint/
├── src/
│   └── index.tsx          # Main Hono app with Stripe + Revolut
├── public/static/
│   └── app.js             # Frontend payment logic
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_orders_table.sql
├── .dev.vars              # Local environment variables
├── wrangler.jsonc         # Cloudflare configuration
├── package.json           # Dependencies
├── vite.config.ts         # Build configuration
├── REVOLUT_SETUP.md       # Revolut integration guide
└── README.md              # This file
```

---

## 🔌 API Endpoints

### Payment Config
```
GET /api/config/payment
→ Returns Stripe publishable key + Revolut merchant ID
```

### Stripe Checkout
```
POST /api/checkout/stripe/create-session
Body: { name, email, birthDay, birthMonth, birthYear, birthPlace, package }
→ Returns Stripe checkout URL
```

### Revolut Checkout
```
POST /api/checkout/revolut/create-order
Body: { name, email, birthDay, birthMonth, birthYear, birthPlace, package }
→ Returns Revolut checkout URL
```

### Webhooks
```
POST /api/checkout/stripe/webhook   # Stripe payment notifications
POST /api/checkout/revolut/webhook  # Revolut payment notifications
```

### Order Status
```
GET /api/orders/:orderId/status
→ Returns order details and payment status
```

---

## 🗄️ Database Schema

### Orders Table
```sql
orders {
  id, order_number, customer_name, customer_email,
  birth_day, birth_month, birth_year, birth_time, birth_place,
  package_name, package_price,
  payment_provider: 'stripe' | 'revolut',
  stripe_session_id, revolut_order_id,
  payment_status: 'pending' | 'completed' | 'failed',
  order_status: 'pending' | 'processing' | 'completed'
}
```

---

## 🧪 Testing

### Test Cards

**Stripe:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**Revolut:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

All cards: Any future expiry + any CVV

---

## 🌐 Deployment

### Cloudflare Pages

```bash
# Set production secrets
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put REVOLUT_API_KEY

# Apply migrations
npm run db:migrate:prod

# Deploy
npm run deploy:prod
```

Your app will be live at: `https://cosmic-blueprint.pages.dev`

---

## 📚 Documentation

- **REVOLUT_SETUP.md** - Complete Revolut integration guide
- **Stripe Docs** - https://stripe.com/docs
- **Revolut API Docs** - https://developer.revolut.com/docs/merchant-api

---

## 🛠️ Tech Stack

- **Framework**: Hono (Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Payments**: Stripe + Revolut
- **Build Tool**: Vite
- **Hosting**: Cloudflare Pages
- **Process Manager**: PM2 (dev only)

---

## 📊 Environment Variables

### Required:
```
STRIPE_SECRET_KEY          # Stripe API key
STRIPE_PUBLISHABLE_KEY     # Stripe public key
STRIPE_WEBHOOK_SECRET      # Stripe webhook signing secret
REVOLUT_API_KEY            # Revolut Merchant API key
REVOLUT_MERCHANT_ID        # Revolut Merchant ID
APP_URL                    # Your app URL
```

### Optional:
```
RESEND_API_KEY            # Email notifications
```

---

## 🔐 Security

- ✅ API keys stored in Cloudflare secrets (production)
- ✅ Webhook signature verification
- ✅ No card data touches our servers
- ✅ PCI compliance handled by Stripe/Revolut
- ✅ `.dev.vars` in `.gitignore`

---

## 💡 Next Steps

1. **Add your API keys** to `.dev.vars`
2. **Test locally** with sandbox keys
3. **Configure webhooks** in Stripe/Revolut dashboards
4. **Deploy to production** when ready
5. **Add email notifications** (optional)
6. **Build full frontend** with checkout UI

---

## 📞 Support

- **Stripe Support**: https://support.stripe.com/
- **Revolut Business**: business@revolut.com
- **Cloudflare**: https://developers.cloudflare.com/

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2025-11-26
