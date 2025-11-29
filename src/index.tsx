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
  // Serve the main HTML file
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cosmic Blueprint - Unlock Your Stars</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        :root{--neon:#CCFF00;--neon-glow:rgba(204,255,0,0.6)}*{margin:0;padding:0;box-sizing:border-box;max-width:100%}html{overflow-x:hidden;width:100%;position:relative}body{background:#000;color:#fff;font-family:'Inter',sans-serif;overflow-x:hidden;width:100%;max-width:100vw;min-height:100vh;position:relative}h1,h2,h3{font-family:'Playfair Display',serif;max-width:100%}p,div,section,nav,a,button{max-width:100%;box-sizing:border-box}.neon-text{color:var(--neon);text-shadow:0 0 20px var(--neon-glow)}.gradient-bg{background:linear-gradient(135deg,#000 0%,#1a0033 50%,#000 100%)}.btn-primary{background:var(--neon);color:#000;font-weight:600;transition:all .3s;cursor:pointer;border:none;outline:none}.btn-primary:hover{box-shadow:0 0 30px var(--neon-glow);transform:scale(1.05)}.card-3d{transition:transform .3s;cursor:pointer}.card-3d:hover{transform:translateY(-10px)}section{width:100%;max-width:100vw;overflow-x:hidden;padding-left:1rem;padding-right:1rem}nav,header,footer{width:100%;max-width:100vw;overflow-x:hidden}.max-w-7xl,.max-w-4xl,.max-w-2xl,.max-w-lg{width:100%;max-width:100%!important;padding-left:1rem;padding-right:1rem;box-sizing:border-box;margin-left:auto;margin-right:auto}.grid{width:100%;max-width:100%;box-sizing:border-box}.modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:9999;align-items:center;justify-content:center;overflow-y:auto;padding:1rem}.modal.active{display:flex!important}.modal>div{max-width:min(90vw,600px);width:100%;margin:auto}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}.float{animation:float 3s ease-in-out infinite}#chat-widget{position:fixed;bottom:20px;right:20px;z-index:9998}#chat-button{width:60px;height:60px;border-radius:50%;background:var(--neon);color:#000;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;box-shadow:0 4px 20px var(--neon-glow)}#chat-box{display:none;position:absolute;bottom:70px;right:0;width:350px;height:500px;background:#1a1a1a;border-radius:16px;border:2px solid var(--neon);flex-direction:column}#chat-box.active{display:flex!important}
    </style>
</head>
<body>
<nav class="fixed w-full z-50 backdrop-blur-md border-b border-gray-800"><div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center space-x-2"><i class="fas fa-star neon-text text-2xl"></i><span class="text-xl font-bold neon-text">Cosmic Blueprint</span></div><div class="hidden md:flex items-center space-x-6"><a href="#tarot" class="hover:text-yellow-400 transition">🔮 Free Tarot</a><a href="#numerology" class="hover:text-yellow-400 transition">🔢 Numerology</a><a href="#packages" class="btn-primary px-6 py-2 rounded-full">View Packages</a></div></div></nav>
<section id="hero" class="gradient-bg min-h-screen flex items-center justify-center px-4 pt-20"><div class="text-center max-w-4xl"><div class="float mb-8"><i class="fas fa-moon text-6xl neon-text"></i></div><h1 class="text-5xl md:text-7xl font-bold mb-6">Unlock the <span class="neon-text">Secrets</span><br>Written in Your Stars</h1><p class="text-xl md:text-2xl text-gray-300 mb-8">Get your personalized astrology reading powered by AI</p><div class="flex flex-col md:flex-row gap-4 justify-center"><a href="#packages" class="btn-primary px-8 py-4 rounded-full text-lg">Get Your Reading Now ✨</a><a href="#tarot" class="bg-gray-800 px-8 py-4 rounded-full text-lg hover:bg-gray-700 transition">Try Free Tarot 🔮</a></div></div></section>
<section id="tarot" class="py-20 px-4"><div class="max-w-4xl mx-auto text-center"><h2 class="text-4xl font-bold mb-4">🔮 <span class="neon-text">FREE</span> Tarot Reading</h2><p class="text-gray-400 mb-8">Draw a card and discover your guidance for today</p><div class="relative mx-auto" style="width:200px;height:300px;perspective:1000px"><div id="tarot-card" class="absolute w-full h-full" style="transform-style:preserve-3d;transition:transform 0.6s"><div class="absolute w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 rounded-2xl flex flex-col items-center justify-center cursor-pointer shadow-2xl border-4 border-yellow-400" style="backface-visibility:hidden" onclick="drawTarot()"><div class="text-6xl mb-4">🌙</div><div class="text-sm font-bold text-yellow-400">COSMIC</div><div class="text-xs text-gray-300">TAP TO REVEAL</div><div class="absolute inset-0 bg-purple-500 opacity-10 rounded-2xl animate-pulse"></div></div><div id="tarot-card-back" class="absolute w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex flex-col items-center justify-center p-4 shadow-2xl border-4 border-purple-900" style="backface-visibility:hidden;transform:rotateY(180deg)"><div id="tarot-card-icon" class="text-5xl mb-3"></div><div id="tarot-card-title" class="text-lg font-bold text-purple-900 text-center mb-2"></div><div class="w-16 h-1 bg-purple-900 mb-2"></div><div class="text-xs text-purple-800 font-semibold">TAROT CARD</div></div></div></div><button onclick="drawTarot()" class="btn-primary px-8 py-3 rounded-full mt-8">Draw a Card</button><div id="tarot-result" class="mt-8 p-6 bg-gray-900 rounded-xl hidden border border-purple-500"><h3 class="text-2xl font-bold mb-2 neon-text" id="tarot-card-name"></h3><p class="text-gray-300 leading-relaxed" id="tarot-card-meaning"></p></div></div></section>
<section id="numerology" class="py-20 px-4 bg-gray-900"><div class="max-w-4xl mx-auto text-center"><h2 class="text-4xl font-bold mb-4">🔢 <span class="neon-text">FREE</span> Numerology Calculator</h2><p class="text-gray-400 mb-8">Calculate your Life Path Number</p><div class="max-w-md mx-auto space-y-4"><input type="date" id="birth-date" class="w-full p-4 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-yellow-400 focus:outline-none"><button onclick="calculateNumerology()" class="btn-primary w-full py-4 rounded-lg">Calculate My Number</button></div><div id="numerology-result" class="mt-8 p-6 bg-gray-800 rounded-xl hidden"><div class="text-6xl font-bold neon-text mb-4" id="life-path-number"></div><h3 class="text-2xl font-bold mb-2">Your Life Path Number</h3><p class="text-gray-300" id="numerology-meaning"></p></div></div></section>
<section id="packages" class="py-20 px-4"><div class="max-w-7xl mx-auto"><h2 class="text-4xl md:text-5xl font-bold text-center mb-4">Choose Your <span class="neon-text">Cosmic Journey</span></h2><p class="text-center text-gray-400 mb-12">Select the perfect reading package for you</p><div class="grid md:grid-cols-3 gap-8"><div class="card-3d bg-gray-900 p-8 rounded-2xl border border-gray-800"><div class="text-center mb-6"><i class="fas fa-star text-5xl text-purple-400 mb-4"></i><h3 class="text-2xl font-bold mb-2">Cosmic Awakening</h3><div class="text-5xl font-bold neon-text my-4">€47</div><p class="text-gray-400">Perfect for beginners</p></div><ul class="space-y-3 mb-8 text-left"><li><i class="fas fa-check text-green-400 mr-2"></i> 15-page personalized report</li><li><i class="fas fa-check text-green-400 mr-2"></i> Sun & Moon sign analysis</li><li><i class="fas fa-check text-green-400 mr-2"></i> Basic compatibility insights</li><li><i class="fas fa-check text-green-400 mr-2"></i> Email delivery in 24h</li></ul><button onclick='openCheckout({name:"Cosmic Awakening",price:47,description:"15-page beginner report"})' class="btn-primary w-full py-3 rounded-full">Get Started</button></div><div class="card-3d bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-2xl border-2 border-yellow-400 relative"><div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">⭐ MOST POPULAR</div><div class="text-center mb-6"><i class="fas fa-gem text-5xl text-yellow-400 mb-4"></i><h3 class="text-2xl font-bold mb-2">Soul Blueprint</h3><div class="text-5xl font-bold text-yellow-400 my-4">€147</div><p class="text-gray-200">Complete deep-dive analysis</p></div><ul class="space-y-3 mb-8 text-left"><li><i class="fas fa-check text-yellow-400 mr-2"></i> 40-page detailed report</li><li><i class="fas fa-check text-yellow-400 mr-2"></i> All planets & houses analyzed</li><li><i class="fas fa-check text-yellow-400 mr-2"></i> Career & relationship guidance</li><li><i class="fas fa-check text-yellow-400 mr-2"></i> Year-ahead forecast</li><li><i class="fas fa-check text-yellow-400 mr-2"></i> Priority 12h delivery</li></ul><button onclick='openCheckout({name:"Soul Blueprint",price:147,description:"40-page complete analysis"})' class="bg-yellow-400 text-black w-full py-3 rounded-full font-bold hover:bg-yellow-300 transition">Get Started</button></div><div class="card-3d bg-gray-900 p-8 rounded-2xl border border-gray-800"><div class="text-center mb-6"><i class="fas fa-crown text-5xl text-purple-400 mb-4"></i><h3 class="text-2xl font-bold mb-2">Destiny Mastery</h3><div class="text-5xl font-bold neon-text my-4">€397</div><p class="text-gray-400">Ultimate transformation</p></div><ul class="space-y-3 mb-8 text-left"><li><i class="fas fa-check text-green-400 mr-2"></i> 80+ page master report</li><li><i class="fas fa-check text-green-400 mr-2"></i> Past life insights</li><li><i class="fas fa-check text-green-400 mr-2"></i> Soul purpose revelation</li><li><i class="fas fa-check text-green-400 mr-2"></i> 1-on-1 video consultation</li><li><i class="fas fa-check text-green-400 mr-2"></i> VIP instant delivery</li></ul><button onclick='openCheckout({name:"Destiny Mastery",price:397,description:"80+ page master report"})' class="btn-primary w-full py-3 rounded-full">Get Started</button></div></div></div></section>
<div id="checkout-modal" class="modal"><div class="bg-gray-900 p-8 rounded-2xl max-w-2xl w-full mx-4 border-2 border-yellow-400 max-h-[90vh] overflow-y-auto"><div class="flex justify-between items-center mb-6"><h2 class="text-3xl font-bold neon-text">Complete Your Order</h2><button onclick="closeModal('checkout-modal')" class="text-3xl hover:text-red-500">&times;</button></div><div id="checkout-package-info" class="bg-gray-800 p-4 rounded-lg mb-6"></div><form id="checkout-form" class="space-y-4"><div><label class="block mb-2">Full Name *</label><input type="text" name="name" required class="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"></div><div><label class="block mb-2">Email *</label><input type="email" name="email" required class="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"></div><div class="grid grid-cols-3 gap-4"><div><label class="block mb-2">Birth Day *</label><input type="number" name="birthDay" min="1" max="31" required class="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"></div><div><label class="block mb-2">Month *</label><select name="birthMonth" required class="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"><option value="">Select</option><option value="1">January</option><option value="2">February</option><option value="3">March</option><option value="4">April</option><option value="5">May</option><option value="6">June</option><option value="7">July</option><option value="8">August</option><option value="9">September</option><option value="10">October</option><option value="11">November</option><option value="12">December</option></select></div><div><label class="block mb-2">Year *</label><input type="number" name="birthYear" min="1900" max="2025" required class="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"></div></div><div><label class="block mb-2">Birth Time (e.g., 14:30)</label><input type="time" name="birthTime" class="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"></div><div><label class="block mb-2">Birth Place *</label><input type="text" name="birthPlace" required placeholder="City, Country" class="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"></div><div><label class="block mb-2">Payment Method *</label><div class="space-y-2"><label class="flex items-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"><input type="radio" name="paymentMethod" value="stripe" checked class="mr-3"><i class="fab fa-stripe text-2xl mr-2 text-purple-400"></i><span>Stripe (Card Payment)</span></label><label class="flex items-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"><input type="radio" name="paymentMethod" value="revolut" class="mr-3"><i class="fas fa-money-bill-wave text-2xl mr-2 text-blue-400"></i><span>Revolut (Lower Fees - 0.8%)</span></label></div></div><div class="flex items-start"><input type="checkbox" required class="mt-1 mr-3"><label class="text-sm text-gray-400">I agree to the Terms & Conditions and Privacy Policy</label></div><button type="submit" class="btn-primary w-full py-4 rounded-lg text-lg font-bold">Proceed to Payment 🔒</button></form></div></div>
<div id="success-modal" class="modal"><div class="bg-gray-900 p-8 rounded-2xl max-w-lg w-full mx-4 border-2 border-green-500 text-center"><div class="text-6xl mb-4">🎉</div><h2 class="text-3xl font-bold neon-text mb-4">Order Confirmed!</h2><p class="text-xl mb-6">Thank you for your purchase</p><div id="success-order-details" class="bg-gray-800 p-4 rounded-lg mb-6"></div><button onclick="closeModal('success-modal')" class="btn-primary px-8 py-3 rounded-full">Close</button></div></div>
<div id="chat-widget"><div id="chat-box"><div class="p-4 border-b border-gray-700 flex justify-between items-center"><h3 class="font-bold">💬 Cosmic Assistant</h3><button onclick="toggleChat()" class="text-2xl">&times;</button></div><div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3"><div class="bg-gray-800 p-3 rounded-lg"><p class="text-sm">👋 Hi! I'm your Cosmic Assistant. Ask me anything about astrology!</p></div></div><div class="p-4 border-t border-gray-700"><div class="flex gap-2"><input type="text" id="chat-input" placeholder="Ask a question..." class="flex-1 p-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none text-sm"><button onclick="sendChatMessage()" class="btn-primary px-4 py-2 rounded-lg"><i class="fas fa-paper-plane"></i></button></div></div></div><div id="chat-button" onclick="toggleChat()"><i class="fas fa-comments"></i></div></div>
<script src="/static/app.js"></script>
</body>
</html>
  `)
  
  return c.html(html)
})

export default app
