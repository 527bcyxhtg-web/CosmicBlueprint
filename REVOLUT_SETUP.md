# 💳 Revolut Business Payment Integration Guide

## 🎯 Overview

Revolut Business Merchant API omogućava plaćanja sa **nižim provizijama** nego Stripe:
- **Revolut**: 0.8% + €0.02 po transakciji
- **Stripe**: 1.4% + €0.25 po transakciji

**Uštedjel bi ~50% na provizijama!** 💰

Za paket od €147:
- Revolut provizija: **€1.18**
- Stripe provizija: **€2.31**
- **Ušteda: €1.13 po prodaji**

---

## 📋 Preduvjeti

### 1. **Revolut Business Račun**
- Registracija: https://business.revolut.com/
- Potreban je **Business** ili **Freelancer** plan
- Besplatno za testiranje u sandbox modu

### 2. **Merchant API Access**
- U Revolut Business aplikaciji: **Settings → Merchant API**
- Aktiviraj "Enable Merchant API"
- Kreiraj API key

---

## 🔑 Kako dobiti API Keys

### **Korak 1: Otvori Revolut Business Account**
1. Idi na: https://business.revolut.com/
2. Odaberi plan (Freelancer ili Business)
3. Završi KYC verifikaciju

### **Korak 2: Aktiviraj Merchant API**
1. Login u Revolut Business app
2. Settings → Merchant API
3. Enable API access
4. Kreiraj novi API key

### **Korak 3: Sandbox vs Production**
```
Sandbox (testing):
• API Key: sandbox_xxx
• URL: https://sandbox-merchant.revolut.com/api/1.0/

Production (real payments):
• API Key: prod_xxx  
• URL: https://merchant.revolut.com/api/1.0/
```

### **Korak 4: Kopiraj Keys**
Trebat će ti:
- **API Key**: `sandbox_xxx` ili `prod_xxx`
- **Merchant ID**: `mer_xxx`

---

## ⚙️ Konfiguracija

### **1. Lokalni Development (.dev.vars)**

```bash
# Edit .dev.vars file
REVOLUT_API_KEY=sandbox_YOUR_API_KEY_HERE
REVOLUT_MERCHANT_ID=YOUR_MERCHANT_ID_HERE
```

### **2. Production (Cloudflare Secrets)**

```bash
# Set Cloudflare secrets
npx wrangler secret put REVOLUT_API_KEY
# Paste: prod_YOUR_ACTUAL_KEY

npx wrangler secret put REVOLUT_MERCHANT_ID
# Paste: mer_YOUR_MERCHANT_ID
```

---

## 🧪 Testiranje (Sandbox Mode)

### **Test Cards za Revolut Sandbox:**

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| `4242 4242 4242 4242` | Any future | Any | ✅ Success |
| `4000 0000 0000 0002` | Any future | Any | ❌ Decline |
| `4000 0000 0000 9995` | Any future | Any | ⏱️ Processing |

---

## 🔄 Payment Flow

### **User Experience:**
```
1. Korisnik odabere paket
2. Klikne "Pay with Revolut"
3. Frontend → POST /api/checkout/revolut/create-order
4. Backend kreira order u bazi
5. Backend poziva Revolut API
6. Revolut vraća checkout_url
7. Frontend redirecta na Revolut checkout
8. Korisnik unese karticu i plati
9. Revolut webhook obavještava backend
10. Order se ažurira (status: completed)
11. Korisnik se vrati na success stranicu
```

### **API Request Example:**
```javascript
POST /api/checkout/revolut/create-order
{
  "name": "Ivan Horvat",
  "email": "ivan@example.com",
  "birthDay": 15,
  "birthMonth": 6,
  "birthYear": 1990,
  "birthTime": "14:30",
  "birthPlace": "Zagreb, Croatia",
  "package": {
    "name": "Soul Blueprint",
    "price": 147,
    "description": "Complete analysis"
  }
}
```

### **API Response:**
```javascript
{
  "success": true,
  "orderId": 123,
  "orderNumber": "CR-12345678",
  "revolutOrderId": "ORD-xxx",
  "checkoutUrl": "https://checkout.revolut.com/...",
  "provider": "revolut"
}
```

---

## 📊 Database Schema

Orders tablica podržava Revolut:

```sql
orders {
  ...
  payment_provider: "revolut"  -- 'stripe' or 'revolut'
  revolut_order_id: "ORD-xxx"
  revolut_public_id: "xxx-xxx"
  payment_status: "completed"
  ...
}
```

---

## 🔗 Webhooks Setup

### **1. Postavi Webhook URL u Revolut-u:**

Production URL:
```
https://cosmic-blueprint.pages.dev/api/checkout/revolut/webhook
```

Local testing (use ngrok):
```bash
# Install ngrok: https://ngrok.com/
ngrok http 3000

# Use URL: https://xxxx.ngrok.io/api/checkout/revolut/webhook
```

### **2. Webhook Events:**
Revolut šalje sljedeće events:
- `ORDER_COMPLETED` - Plaćanje uspješno
- `ORDER_AUTHORISED` - Plaćanje autorizirano
- `ORDER_CANCELLED` - Plaćanje otkazano

---

## 🆚 Stripe vs Revolut - Usporedba

| Feature | Stripe | Revolut |
|---------|--------|---------|
| **Provizija** | 1.4% + €0.25 | 0.8% + €0.02 |
| **Setup** | Instant | Business račun |
| **Best for** | Global | EU/UK |
| **Currencies** | 135+ | 30+ |
| **Settlement** | 2-7 days | Instant |
| **Webhooks** | ✅ Best | ✅ Good |
| **Documentation** | ✅✅✅ Excellent | ✅✅ Good |
| **Test mode** | ✅ Easy | ✅ Sandbox |

---

## 💡 Kada koristiti što?

### **Koristi Revolut ako:**
- ✅ Većina korisnika iz EU/UK
- ✅ Želiš niže provizije
- ✅ Imaš Revolut Business račun
- ✅ Instant settlements su važni

### **Koristi Stripe ako:**
- ✅ Globalna publika
- ✅ Trebaju ti advanced features
- ✅ Brz setup je prioritet
- ✅ Želiš najbolju dokumentaciju

### **Koristi OBOJE ako:**
- ✅ Želiš maksimalnu konverziju
- ✅ Možeš održavati 2 integracije
- ✅ Korisnici preferiraju izbor

---

## 🐛 Troubleshooting

### **"Invalid API Key"**
- Provjeri jesi li kopirao cijeli key (sa `sandbox_` ili `prod_` prefixom)
- Provjeri jesi li aktivirao Merchant API u Revolut-u

### **"Merchant not found"**
- Merchant ID mora biti format: `mer_xxx`
- Provjeri u Revolut Business → Settings → Merchant API

### **Webhook ne radi**
- Provjeri URL je li javno dostupan
- Za lokalni test koristi ngrok
- Provjeri webhook logs u Revolut dashboardu

### **"Order creation failed"**
- Amount mora biti u centima (€147 = 14700)
- Currency mora biti uppercase ('EUR', ne 'eur')
- Email mora biti validan format

---

## 📞 Resources

- **Revolut Business**: https://business.revolut.com/
- **API Docs**: https://developer.revolut.com/docs/merchant-api
- **Support**: business@revolut.com
- **Sandbox**: https://sandbox-business.revolut.com/

---

## ✅ Setup Checklist

- [ ] Otvori Revolut Business račun
- [ ] Aktiviraj Merchant API
- [ ] Generiraj sandbox API key
- [ ] Dodaj keyeve u `.dev.vars`
- [ ] Testiraj sa test karticom
- [ ] Postavi webhook URL
- [ ] Testiraj webhook lokalno (ngrok)
- [ ] Stvori production API key
- [ ] Deploy na Cloudflare
- [ ] Postavi production webhook
- [ ] Testiraj production plaćanje

---

**Implementirano:** 2025-11-26  
**Status:** ✅ Ready for testing
