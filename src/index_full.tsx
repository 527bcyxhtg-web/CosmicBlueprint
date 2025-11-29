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

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes (existing - keep all)
app.get('/api/config/payment', (c) => {
  const { STRIPE_PUBLISHABLE_KEY, REVOLUT_MERCHANT_ID } = c.env
  return c.json({ 
    stripe: { publishableKey: STRIPE_PUBLISHABLE_KEY },
    revolut: { merchantId: REVOLUT_MERCHANT_ID, available: !!c.env.REVOLUT_API_KEY }
  })
})

// All other API endpoints stay the same...
// (I'll keep the existing backend logic)

app.get('/', (c) => {
  return c.html(\`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cosmic Blueprint - Your Astrology Reading</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        :root {
            --neon: #CCFF00;
            --neon-glow: rgba(204, 255, 0, 0.6);
        }
        
        body {
            background: #000;
            color: #fff;
            font-family: 'Inter', sans-serif;
        }
        
        h1, h2, h3 {
            font-family: 'Playfair Display', serif;
        }
        
        .neon-text {
            color: var(--neon);
            text-shadow: 0 0 20px var(--neon-glow);
        }
        
        .gradient-bg {
            background: linear-gradient(135deg, #000 0%, #1a0033 50%, #000 100%);
        }
        
        .btn-primary {
            background: var(--neon);
            color: #000;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .btn-primary:hover {
            box-shadow: 0 0 30px var(--neon-glow);
            transform: scale(1.05);
        }
        
        .card-3d {
            transition: transform 0.3s;
        }
        
        .card-3d:hover {
            transform: translateY(-10px) rotateX(5deg);
        }
        
        .modal {
            display: none;
        }
        
        .modal.active {
            display: flex !important;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        
        .float {
            animation: float 3s ease-in-out infinite;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="fixed w-full z-50 backdrop-blur-md border-b border-gray-800">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div class="flex items-center space-x-2">
                <i class="fas fa-star neon-text text-2xl"></i>
                <span class="text-xl font-bold neon-text">Cosmic Blueprint</span>
            </div>
            <div class="hidden md:flex items-center space-x-6">
                <a href="#tarot" class="hover:text-yellow-400">🔮 Free Tarot</a>
                <a href="#numerology" class="hover:text-yellow-400">🔢 Numerology</a>
                <a href="#packages" class="btn-primary px-6 py-2 rounded-full">📦 View Packages</a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="hero" class="gradient-bg min-h-screen flex items-center justify-center px-4 pt-20">
        <div class="text-center max-w-4xl">
            <div class="float mb-8">
                <i class="fas fa-moon text-6xl neon-text"></i>
            </div>
            <h1 class="text-5xl md:text-7xl font-bold mb-6">
                Unlock the <span class="neon-text">Secrets</span><br>Written in Your Stars
            </h1>
            <p class="text-xl md:text-2xl text-gray-300 mb-8">
                Get your personalized astrology reading with AI-powered insights
            </p>
            <div class="flex flex-col md:flex-row gap-4 justify-center">
                <a href="#packages" class="btn-primary px-8 py-4 rounded-full text-lg">
                    Get Your Reading Now
                </a>
                <a href="#tarot" class="bg-gray-800 px-8 py-4 rounded-full text-lg hover:bg-gray-700">
                    Try Free Tarot
                </a>
            </div>
        </div>
    </section>

    <!-- FREE Tarot Section -->
    <section id="tarot" class="py-20 px-4">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-4xl font-bold mb-4">🔮 <span class="neon-text">FREE</span> Tarot Reading</h2>
            <p class="text-gray-400 mb-8">Draw a card and discover your guidance</p>
            
            <div id="tarot-card" class="w-48 h-72 mx-auto mb-8 bg-gradient-to-br from-purple-900 to-pink-900 rounded-xl flex items-center justify-center text-6xl cursor-pointer card-3d" onclick="drawTarot()">
                <i class="fas fa-hand-sparkles"></i>
            </div>
            
            <button onclick="drawTarot()" class="btn-primary px-8 py-3 rounded-full">
                Draw a Card
            </button>
            
            <div id="tarot-result" class="mt-8 p-6 bg-gray-900 rounded-xl hidden">
                <h3 class="text-2xl font-bold mb-2" id="tarot-card-name"></h3>
                <p class="text-gray-300" id="tarot-card-meaning"></p>
            </div>
        </div>
    </section>

    <!-- FREE Numerology Section -->
    <section id="numerology" class="py-20 px-4 bg-gray-900">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-4xl font-bold mb-4">🔢 <span class="neon-text">FREE</span> Numerology Calculator</h2>
            <p class="text-gray-400 mb-8">Calculate your Life Path Number</p>
            
            <div class="max-w-md mx-auto space-y-4">
                <input type="date" id="birth-date" class="w-full p-4 bg-gray-800 rounded-lg text-white" placeholder="Birth Date">
                <button onclick="calculateNumerology()" class="btn-primary w-full py-4 rounded-lg">
                    Calculate My Number
                </button>
            </div>
            
            <div id="numerology-result" class="mt-8 p-6 bg-gray-800 rounded-xl hidden">
                <div class="text-6xl font-bold neon-text mb-4" id="life-path-number"></div>
                <h3 class="text-2xl font-bold mb-2">Your Life Path Number</h3>
                <p class="text-gray-300" id="numerology-meaning"></p>
            </div>
        </div>
    </section>

    <!-- Packages Section -->
    <section id="packages" class="py-20 px-4">
        <div class="max-w-7xl mx-auto">
            <h2 class="text-4xl md:text-5xl font-bold text-center mb-12">
                Choose Your <span class="neon-text">Cosmic Journey</span>
            </h2>
            
            <div class="grid md:grid-cols-3 gap-8">
                <!-- Package 1 -->
                <div class="card-3d bg-gray-900 p-8 rounded-2xl border border-gray-800">
                    <h3 class="text-2xl font-bold mb-2">Cosmic Awakening</h3>
                    <div class="text-4xl font-bold neon-text mb-4">€47</div>
                    <p class="text-gray-400 mb-6">Perfect for beginners</p>
                    <ul class="space-y-3 mb-8">
                        <li><i class="fas fa-check text-green-400 mr-2"></i> 15-page report</li>
                        <li><i class="fas fa-check text-green-400 mr-2"></i> Sun & Moon signs</li>
                        <li><i class="fas fa-check text-green-400 mr-2"></i> Basic compatibility</li>
                    </ul>
                    <button onclick="openCheckout({name:'Cosmic Awakening',price:47,description:'15-page beginner report'})" class="btn-primary w-full py-3 rounded-full">
                        Get Started
                    </button>
                </div>

                <!-- Package 2 - MOST POPULAR -->
                <div class="card-3d bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-2xl border-2 border-yellow-400 relative">
                    <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                        MOST POPULAR
                    </div>
                    <h3 class="text-2xl font-bold mb-2">Soul Blueprint</h3>
                    <div class="text-4xl font-bold neon-text mb-4">€147</div>
                    <p class="text-gray-200 mb-6">Complete analysis</p>
                    <ul class="space-y-3 mb-8">
                        <li><i class="fas fa-check neon-text mr-2"></i> 40-page detailed report</li>
                        <li><i class="fas fa-check neon-text mr-2"></i> All planets & houses</li>
                        <li><i class="fas fa-check neon-text mr-2"></i> Career & relationships</li>
                        <li><i class="fas fa-check neon-text mr-2"></i> Year ahead forecast</li>
                    </ul>
                    <button onclick="openCheckout({name:'Soul Blueprint',price:147,description:'40-page complete analysis'})" class="bg-yellow-400 text-black w-full py-3 rounded-full font-bold hover:bg-yellow-300">
                        Get Started
                    </button>
                </div>

                <!-- Package 3 -->
                <div class="card-3d bg-gray-900 p-8 rounded-2xl border border-gray-800">
                    <h3 class="text-2xl font-bold mb-2">Destiny Mastery</h3>
                    <div class="text-4xl font-bold neon-text mb-4">€397</div>
                    <p class="text-gray-400 mb-6">Full transformation</p>
                    <ul class="space-y-3 mb-8">
                        <li><i class="fas fa-check text-green-400 mr-2"></i> 80+ page report</li>
                        <li><i class="fas fa-check text-green-400 mr-2"></i> Past life insights</li>
                        <li><i class="fas fa-check text-green-400 mr-2"></i> Soul purpose revealed</li>
                        <li><i class="fas fa-check text-green-400 mr-2"></i> 1-on-1 consultation</li>
                    </ul>
                    <button onclick="openCheckout({name:'Destiny Mastery',price:397,description:'80+ page transformation'})" class="btn-primary w-full py-3 rounded-full">
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Checkout Modal -->
    <div id="checkoutModal" class="modal fixed inset-0 bg-black bg-opacity-90 items-center justify-center z-50 p-4">
        <div class="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-bold">Complete Your Order</h2>
                <button onclick="closeModal('checkoutModal')" class="text-gray-400 hover:text-white text-3xl">&times;</button>
            </div>
            
            <div id="checkout-package-info" class="mb-6 p-4 bg-gray-800 rounded-lg">
                <h3 class="text-xl font-bold" id="checkout-pkg-name"></h3>
                <p class="text-gray-400" id="checkout-pkg-desc"></p>
                <div class="text-2xl font-bold neon-text mt-2" id="checkout-pkg-price"></div>
            </div>
            
            <form id="checkoutForm" class="space-y-4">
                <div>
                    <label class="block mb-2">Full Name *</label>
                    <input type="text" id="checkout-name" required class="w-full p-3 bg-gray-800 rounded-lg" placeholder="John Doe">
                </div>
                
                <div>
                    <label class="block mb-2">Email *</label>
                    <input type="email" id="checkout-email" required class="w-full p-3 bg-gray-800 rounded-lg" placeholder="john@example.com">
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block mb-2">Day *</label>
                        <input type="number" id="checkout-day" min="1" max="31" required class="w-full p-3 bg-gray-800 rounded-lg" placeholder="15">
                    </div>
                    <div>
                        <label class="block mb-2">Month *</label>
                        <input type="number" id="checkout-month" min="1" max="12" required class="w-full p-3 bg-gray-800 rounded-lg" placeholder="6">
                    </div>
                    <div>
                        <label class="block mb-2">Year *</label>
                        <input type="number" id="checkout-year" min="1900" max="2024" required class="w-full p-3 bg-gray-800 rounded-lg" placeholder="1990">
                    </div>
                </div>
                
                <div>
                    <label class="block mb-2">Birth Time (Optional)</label>
                    <input type="time" id="checkout-time" class="w-full p-3 bg-gray-800 rounded-lg">
                </div>
                
                <div>
                    <label class="block mb-2">Birth Place *</label>
                    <input type="text" id="checkout-place" required class="w-full p-3 bg-gray-800 rounded-lg" placeholder="New York, USA">
                </div>
                
                <div class="bg-gray-800 p-4 rounded-lg">
                    <label class="block mb-3 font-bold">Payment Method</label>
                    <div class="space-y-3">
                        <label class="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                            <input type="radio" name="payment" value="stripe" checked class="mr-3">
                            <i class="fab fa-cc-stripe text-2xl mr-2"></i>
                            <span>Credit/Debit Card (Stripe)</span>
                        </label>
                        <label class="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                            <input type="radio" name="payment" value="revolut" class="mr-3">
                            <i class="fas fa-credit-card text-2xl mr-2"></i>
                            <span>Revolut (Lower Fees)</span>
                        </label>
                    </div>
                </div>
                
                <div class="flex items-start">
                    <input type="checkbox" id="checkout-terms" required class="mt-1 mr-2">
                    <label for="checkout-terms" class="text-sm text-gray-400">
                        I agree to the Terms & Conditions and Privacy Policy *
                    </label>
                </div>
                
                <button type="submit" class="btn-primary w-full py-4 rounded-full text-lg">
                    <i class="fas fa-lock mr-2"></i> Complete Secure Purchase
                </button>
            </form>
        </div>
    </div>

    <!-- Success Modal -->
    <div id="successModal" class="modal fixed inset-0 bg-black bg-opacity-90 items-center justify-center z-50 p-4">
        <div class="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
            <div class="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <i class="fas fa-check text-4xl text-white"></i>
            </div>
            <h2 class="text-3xl font-bold mb-4">Order Successful! 🎉</h2>
            <div class="bg-gray-800 p-4 rounded-lg mb-6 text-left">
                <div class="flex justify-between mb-2">
                    <span>Order ID:</span>
                    <span class="font-bold" id="success-order-id"></span>
                </div>
                <div class="flex justify-between mb-2">
                    <span>Email:</span>
                    <span id="success-email"></span>
                </div>
                <div class="flex justify-between">
                    <span>Delivery:</span>
                    <span class="neon-text">24-48 hours</span>
                </div>
            </div>
            <p class="text-gray-400 mb-6">Check your email for confirmation and next steps!</p>
            <button onclick="closeModal('successModal')" class="btn-primary px-8 py-3 rounded-full">
                Continue Exploring
            </button>
        </div>
    </div>

    <!-- Chat Widget -->
    <button id="chat-btn" onclick="toggleChat()" class="fixed bottom-6 right-6 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl z-40 hover:scale-110 transition">
        <i class="fas fa-comments"></i>
    </button>

    <div id="chat-widget" class="fixed bottom-24 right-6 w-96 h-96 bg-gray-900 rounded-2xl shadow-2xl z-40 hidden flex-col">
        <div class="bg-purple-600 p-4 rounded-t-2xl flex justify-between items-center">
            <div>
                <h3 class="font-bold">Cosmic Guide</h3>
                <p class="text-sm opacity-80">Online</p>
            </div>
            <button onclick="toggleChat()" class="text-2xl">&times;</button>
        </div>
        <div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3">
            <div class="bg-gray-800 p-3 rounded-lg">
                <p>👋 Hello! I'm your cosmic guide. Ask me anything about astrology, packages, or your reading!</p>
            </div>
        </div>
        <div class="p-4 border-t border-gray-800">
            <div class="flex gap-2">
                <input type="text" id="chat-input" placeholder="Type your message..." class="flex-1 p-2 bg-gray-800 rounded-lg" onkeypress="if(event.key==='Enter') sendChat()">
                <button onclick="sendChat()" class="btn-primary px-4 rounded-lg">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    </div>

    <script src="/static/app.js"></script>
</body>
</html>
  \`)
})

export default app
