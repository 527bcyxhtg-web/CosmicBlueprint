// Cosmic Blueprint - Full Frontend JavaScript
console.log('🚀 Cosmic Blueprint loaded!');

let paymentConfig = {stripe: null, revolut: null};
let selectedPackage = null;

// Load payment config
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/config/payment');
    paymentConfig = await res.json();
    console.log('💳 Payment config:', paymentConfig);
  } catch (e) {
    console.error('Config load failed:', e);
  }
  handlePaymentReturn();
});

// Payment return handler
function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('checkout');
  const orderId = params.get('order_id');
  const provider = params.get('provider');
  
  if (status === 'success' && orderId) {
    fetch(`/api/orders/${orderId}/status`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          document.getElementById('success-order-id').textContent = d.order.orderNumber;
          document.getElementById('success-email').textContent = d.order.email;
          document.getElementById('successModal').classList.remove('hidden');
          document.getElementById('successModal').style.display = 'flex';
        }
      });
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (status === 'cancelled') {
    alert('Payment cancelled');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Open checkout
window.openCheckout = function(pkg) {
  selectedPackage = pkg;
  document.getElementById('checkout-pkg-name').textContent = pkg.name;
  document.getElementById('checkout-pkg-desc').textContent = pkg.description;
  document.getElementById('checkout-pkg-price').textContent = '€' + pkg.price;
  document.getElementById('checkoutModal').classList.remove('hidden');
  document.getElementById('checkoutModal').style.display = 'flex';
};

// Close modal
window.closeModal = function(id) {
  document.getElementById(id).classList.add('hidden');
  document.getElementById(id).style.display = 'none';
};

// Checkout form
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
      btn.disabled = true;
      
      const data = {
        name: document.getElementById('checkout-name').value,
        email: document.getElementById('checkout-email').value,
        birthDay: parseInt(document.getElementById('checkout-day').value),
        birthMonth: parseInt(document.getElementById('checkout-month').value),
        birthYear: parseInt(document.getElementById('checkout-year').value),
        birthTime: document.getElementById('checkout-time').value,
        birthPlace: document.getElementById('checkout-place').value,
        package: selectedPackage,
        paymentMethod: document.querySelector('input[name="payment"]:checked').value
      };
      
      try {
        const provider = data.paymentMethod === 'revolut' ? 'revolut' : 'stripe';
        const endpoint = provider === 'revolut' 
          ? '/api/checkout/revolut/create-order'
          : '/api/checkout/stripe/create-session';
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (result.success) {
          localStorage.setItem('pending_order', JSON.stringify({
            orderId: result.orderId,
            orderNumber: result.orderNumber,
            email: data.email
          }));
          window.location.href = result.checkoutUrl;
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        alert('Checkout failed: ' + err.message);
        btn.innerHTML = orig;
        btn.disabled = false;
      }
    });
  }
});

// Tarot cards
const tarotCards = [
  {name:'The Fool',meaning:'New beginnings and adventures await'},
  {name:'The Magician',meaning:'Manifest your desires with focus'},
  {name:'The High Priestess',meaning:'Trust your intuition'},
  {name:'The Empress',meaning:'Abundance and creativity flow'},
  {name:'The Emperor',meaning:'Structure brings success'},
  {name:'The Lovers',meaning:'Important choice ahead'},
  {name:'The Chariot',meaning:'Victory through determination'},
  {name:'Strength',meaning:'Inner power conquers all'},
  {name:'The Hermit',meaning:'Seek wisdom within'},
  {name:'Wheel of Fortune',meaning:'Change is coming'}
];

window.drawTarot = function() {
  const card = tarotCards[Math.floor(Math.random() * tarotCards.length)];
  const cardEl = document.getElementById('tarot-card');
  cardEl.style.transform = 'rotateY(180deg)';
  setTimeout(() => {
    document.getElementById('tarot-card-name').textContent = card.name;
    document.getElementById('tarot-card-meaning').textContent = card.meaning;
    document.getElementById('tarot-result').classList.remove('hidden');
    cardEl.style.transform = 'rotateY(0deg)';
  }, 300);
};

// Numerology
window.calculateNumerology = function() {
  const date = document.getElementById('birth-date').value;
  if (!date) {alert('Enter birth date'); return;}
  
  const digits = date.replace(/\D/g, '').split('').map(Number);
  let sum = digits.reduce((a,b) => a+b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').map(Number).reduce((a,b) => a+b, 0);
  }
  
  const meanings = {
    1:'Leader - Independent and ambitious',
    2:'Peacemaker - Diplomatic and cooperative',
    3:'Creative - Expressive and optimistic',
    4:'Builder - Practical and hardworking',
    5:'Adventurer - Freedom-loving and dynamic',
    6:'Nurturer - Caring and responsible',
    7:'Seeker - Analytical and spiritual',
    8:'Powerhouse - Ambitious and successful',
    9:'Humanitarian - Compassionate and wise',
    11:'Master - Intuitive and inspirational',
    22:'Master Builder - Visionary and practical',
    33:'Master Teacher - Compassionate leader'
  };
  
  document.getElementById('life-path-number').textContent = sum;
  document.getElementById('numerology-meaning').textContent = meanings[sum] || 'Unique path';
  document.getElementById('numerology-result').classList.remove('hidden');
};

// Chat
window.toggleChat = function() {
  const widget = document.getElementById('chat-widget');
  if (widget.style.display === 'none' || !widget.style.display) {
    widget.classList.remove('hidden');
    widget.style.display = 'flex';
  } else {
    widget.classList.add('hidden');
    widget.style.display = 'none';
  }
};

window.sendChat = function() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  
  const messages = document.getElementById('chat-messages');
  messages.innerHTML += `<div class="bg-gray-700 p-3 rounded-lg text-right">${msg}</div>`;
  input.value = '';
  
  setTimeout(() => {
    const responses = [
      'Our packages include detailed birth chart analysis 📊',
      'You get a comprehensive PDF report within 24-48 hours 📧',
      'We accept both Stripe and Revolut payments 💳',
      'Each reading is personalized based on your birth details ⭐'
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    messages.innerHTML += `<div class="bg-gray-800 p-3 rounded-lg">${reply}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 1000);
};

console.log('✅ All features loaded');
