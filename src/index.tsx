import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import Stripe from 'stripe'
import axios from 'axios'

type Bindings = {
  DB: D1Database
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  REVOLUT_API_KEY: string
  REVOLUT_MERCHANT_ID: string
  RESEND_API_KEY?: string
  APP_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// API ROUTES
// ============================================

// Get config (Stripe + Revolut publishable data)
app.get('/api/config/payment', (c) => {
  const { STRIPE_PUBLISHABLE_KEY, REVOLUT_MERCHANT_ID } = c.env
  return c.json({ 
    stripe: {
      publishableKey: STRIPE_PUBLISHABLE_KEY
    },
    revolut: {
      merchantId: REVOLUT_MERCHANT_ID,
      available: !!c.env.REVOLUT_API_KEY
    }
  })
})

// ===========================================
// STRIPE PAYMENT ENDPOINTS
// ===========================================

// Create Stripe checkout session
app.post('/api/checkout/stripe/create-session', async (c) => {
  const { DB, STRIPE_SECRET_KEY, APP_URL } = c.env
  
  try {
    const body = await c.req.json()
    const { name, email, birthDay, birthMonth, birthYear, birthTime, birthPlace, package: packageData } = body
    
    if (!name || !email || !birthDay || !birthMonth || !birthYear || !birthPlace || !packageData) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }
    
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
    const orderNumber = 'CR-' + Date.now().toString().slice(-8)
    
    // Get or create package
    let pkg = await DB.prepare('SELECT * FROM packages WHERE name = ?').bind(packageData.name).first()
    if (!pkg) {
      const insertResult = await DB.prepare(
        'INSERT INTO packages (name, slug, description, price, features) VALUES (?, ?, ?, ?, ?)'
      ).bind(packageData.name, packageData.name.toLowerCase().replace(/\s+/g, '-'), packageData.description || '', packageData.price, JSON.stringify([])).run()
      pkg = { id: insertResult.meta.last_row_id, name: packageData.name, price: packageData.price }
    }
    
    // Create order
    const orderResult = await DB.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_email,
        birth_day, birth_month, birth_year, birth_time, birth_place,
        package_id, package_name, package_price,
        payment_provider, payment_method, payment_status, order_status, terms_accepted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'stripe', 'card', 'pending', 'pending', 1)
    `).bind(orderNumber, name, email, birthDay, birthMonth, birthYear, birthTime || null, birthPlace, pkg.id, packageData.name, packageData.price).run()
    
    const orderId = orderResult.meta.last_row_id
    
    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: packageData.name, description: packageData.description || `Complete ${packageData.name} astrology reading` },
          unit_amount: Math.round(packageData.price * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${APP_URL}?checkout=success&session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&provider=stripe`,
      cancel_url: `${APP_URL}?checkout=cancelled`,
      customer_email: email,
      metadata: { order_id: orderId.toString(), order_number: orderNumber, customer_name: name }
    })
    
    await DB.prepare('UPDATE orders SET stripe_session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(session.id, orderId).run()
    
    return c.json({ success: true, sessionId: session.id, checkoutUrl: session.url, orderId, orderNumber, provider: 'stripe' })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return c.json({ success: false, error: error.message || 'Failed to create Stripe session' }, 500)
  }
})

// ===========================================
// REVOLUT PAYMENT ENDPOINTS
// ===========================================

// Create Revolut order
app.post('/api/checkout/revolut/create-order', async (c) => {
  const { DB, REVOLUT_API_KEY, APP_URL } = c.env
  
  try {
    const body = await c.req.json()
    const { name, email, birthDay, birthMonth, birthYear, birthTime, birthPlace, package: packageData } = body
    
    if (!name || !email || !birthDay || !birthMonth || !birthYear || !birthPlace || !packageData) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }
    
    const orderNumber = 'CR-' + Date.now().toString().slice(-8)
    
    // Get or create package
    let pkg = await DB.prepare('SELECT * FROM packages WHERE name = ?').bind(packageData.name).first()
    if (!pkg) {
      const insertResult = await DB.prepare(
        'INSERT INTO packages (name, slug, description, price, features) VALUES (?, ?, ?, ?, ?)'
      ).bind(packageData.name, packageData.name.toLowerCase().replace(/\s+/g, '-'), packageData.description || '', packageData.price, JSON.stringify([])).run()
      pkg = { id: insertResult.meta.last_row_id, name: packageData.name, price: packageData.price }
    }
    
    // Create order in DB
    const orderResult = await DB.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_email,
        birth_day, birth_month, birth_year, birth_time, birth_place,
        package_id, package_name, package_price,
        payment_provider, payment_method, payment_status, order_status, terms_accepted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'revolut', 'card', 'pending', 'pending', 1)
    `).bind(orderNumber, name, email, birthDay, birthMonth, birthYear, birthTime || null, birthPlace, pkg.id, packageData.name, packageData.price).run()
    
    const orderId = orderResult.meta.last_row_id
    
    // Create Revolut order
    const revolutOrder = await axios.post('https://merchant.revolut.com/api/1.0/orders', {
      amount: Math.round(packageData.price * 100), // Amount in cents
      currency: 'EUR',
      merchant_order_ext_ref: orderNumber,
      customer_email: email,
      description: `${packageData.name} - Cosmic Blueprint`,
      success_url: `${APP_URL}?checkout=success&order_id=${orderId}&provider=revolut`,
      cancel_url: `${APP_URL}?checkout=cancelled`,
      metadata: {
        customer_name: name,
        birth_details: `${birthDay}/${birthMonth}/${birthYear}`,
        order_id: orderId.toString()
      }
    }, {
      headers: {
        'Authorization': `Bearer ${REVOLUT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const revolutData = revolutOrder.data
    
    // Update order with Revolut IDs
    await DB.prepare('UPDATE orders SET revolut_order_id = ?, revolut_public_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(revolutData.id, revolutData.public_id, orderId).run()
    
    return c.json({
      success: true,
      orderId,
      orderNumber,
      revolutOrderId: revolutData.id,
      checkoutUrl: revolutData.checkout_url,
      provider: 'revolut'
    })
  } catch (error: any) {
    console.error('Revolut checkout error:', error.response?.data || error.message)
    return c.json({ success: false, error: error.response?.data?.message || error.message || 'Failed to create Revolut order' }, 500)
  }
})

// ===========================================
// WEBHOOK ENDPOINTS
// ===========================================

// Stripe webhook
app.post('/api/checkout/stripe/webhook', async (c) => {
  const { DB, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = c.env
  
  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
    const signature = c.req.header('stripe-signature')
    const body = await c.req.text()
    
    if (!signature) return c.json({ error: 'Missing signature' }, 400)
    
    const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id
      
      if (orderId) {
        await DB.prepare(`
          UPDATE orders 
          SET payment_status = 'completed', order_status = 'processing',
              stripe_payment_intent_id = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(session.payment_intent as string, orderId).run()
      }
    }
    
    return c.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook error:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Revolut webhook
app.post('/api/checkout/revolut/webhook', async (c) => {
  const { DB } = c.env
  
  try {
    const body = await c.req.json()
    
    // Revolut webhook sends order updates
    if (body.event === 'ORDER_COMPLETED') {
      const revolutOrderId = body.order_id
      
      await DB.prepare(`
        UPDATE orders 
        SET payment_status = 'completed', order_status = 'processing',
            completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE revolut_order_id = ?
      `).bind(revolutOrderId).run()
    }
    
    return c.json({ received: true })
  } catch (error: any) {
    console.error('Revolut webhook error:', error)
    return c.json({ error: error.message }, 400)
  }
})

// Get order status
app.get('/api/orders/:orderId/status', async (c) => {
  const { DB } = c.env
  const orderId = c.req.param('orderId')
  
  try {
    const order = await DB.prepare(`
      SELECT order_number, customer_email, package_name, package_price, 
             payment_status, order_status, payment_provider, created_at
      FROM orders WHERE id = ?
    `).bind(orderId).first()
    
    if (!order) return c.json({ success: false, error: 'Order not found' }, 404)
    
    return c.json({ 
      success: true, 
      order: {
        orderNumber: order.order_number,
        email: order.customer_email,
        packageName: order.package_name,
        price: order.package_price,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        provider: order.payment_provider,
        createdAt: order.created_at
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================
// FRONTEND ROUTE - Placeholder minimal HTML
// ============================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cosmic Blueprint - Payment Integration Ready</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background: #000; color: #fff; font-family: sans-serif; }
          .neon { color: #CCFF00; text-shadow: 0 0 10px #CCFF00; }
        </style>
    </head>
    <body class="p-8">
        <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-5xl font-bold mb-6">
                <span class="neon">🚀 Cosmic Blueprint</span>
            </h1>
            <h2 class="text-3xl mb-8">Payment Integration: READY! ✅</h2>
            
            <div class="grid md:grid-cols-2 gap-6 mb-12">
                <div class="bg-gray-900 p-6 rounded-lg border border-green-500">
                    <h3 class="text-2xl mb-4 neon">✅ Stripe Integration</h3>
                    <p class="text-gray-300">Full Stripe Checkout Sessions</p>
                    <p class="text-gray-300">Webhook handling</p>
                    <p class="text-gray-300">Order tracking</p>
                </div>
                
                <div class="bg-gray-900 p-6 rounded-lg border border-yellow-500">
                    <h3 class="text-2xl mb-4 neon">✅ Revolut Integration</h3>
                    <p class="text-gray-300">Merchant API ready</p>
                    <p class="text-gray-300">Lower fees (0.8%)</p>
                    <p class="text-gray-300">EU optimized</p>
                </div>
            </div>
            
            <div class="bg-blue-900 p-6 rounded-lg mb-8">
                <h3 class="text-2xl mb-4">📋 Next Steps:</h3>
                <ol class="text-left max-w-2xl mx-auto space-y-2">
                    <li>1️⃣ Add your Stripe API keys to .dev.vars</li>
                    <li>2️⃣ Add your Revolut API keys to .dev.vars</li>
                    <li>3️⃣ Run: npm run build</li>
                    <li>4️⃣ Run: pm2 start ecosystem.config.cjs</li>
                    <li>5️⃣ Test checkout flow!</li>
                </ol>
            </div>
            
            <div class="text-sm text-gray-400">
                <p>📚 Documentation: REVOLUT_SETUP.md & PAYMENT_SETUP.md</p>
                <p>🔧 API Endpoints: /api/config/payment</p>
            </div>
        </div>
        
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
