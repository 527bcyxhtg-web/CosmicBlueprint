// Cosmic Blueprint - Complete Frontend JavaScript
console.log('🚀 Cosmic Blueprint App Loaded!');

let paymentConfig = { stripe: null, revolut: null };
let selectedPackage = null;

// ===================================
// MODAL FUNCTIONS
// ===================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

window.closeModal = closeModal;

// ===================================
// TAROT FUNCTIONS
// ===================================
const tarotCards = [
  { name: 'The Fool', meaning: 'New beginnings, innocence, spontaneity. A fresh start awaits you!' },
  { name: 'The Magician', meaning: 'Manifestation, resourcefulness, power. You have all the tools you need.' },
  { name: 'The High Priestess', meaning: 'Intuition, sacred knowledge, divine feminine. Trust your inner voice.' },
  { name: 'The Empress', meaning: 'Femininity, beauty, nature, abundance. Creativity flows through you.' },
  { name: 'The Emperor', meaning: 'Authority, structure, control, father figure. Take charge of your life.' },
  { name: 'The Lovers', meaning: 'Love, harmony, relationships, values alignment. Important choices ahead.' },
  { name: 'The Chariot', meaning: 'Control, willpower, success, determination. Victory is within reach.' },
  { name: 'Strength', meaning: 'Courage, persuasion, influence, compassion. Inner strength prevails.' },
  { name: 'The Hermit', meaning: 'Soul searching, introspection, inner guidance. Time for reflection.' },
  { name: 'Wheel of Fortune', meaning: 'Good luck, karma, life cycles, destiny. Change is coming.' },
  { name: 'Justice', meaning: 'Justice, fairness, truth, cause and effect. Balance will be restored.' },
  { name: 'The Hanged Man', meaning: 'Pause, surrender, letting go, new perspective. Release control.' },
  { name: 'Death', meaning: 'Endings, change, transformation, transition. Embrace the new chapter.' },
  { name: 'Temperance', meaning: 'Balance, moderation, patience, purpose. Find your middle path.' },
  { name: 'The Devil', meaning: 'Shadow self, attachment, addiction, restriction. Break free from chains.' },
  { name: 'The Tower', meaning: 'Sudden change, upheaval, chaos, revelation. Breakthrough coming.' },
  { name: 'The Star', meaning: 'Hope, faith, purpose, renewal, spirituality. Your wishes will manifest.' },
  { name: 'The Moon', meaning: 'Illusion, fear, anxiety, subconscious. Trust the journey.' },
  { name: 'The Sun', meaning: 'Positivity, fun, warmth, success, vitality. Joy is yours!' },
  { name: 'Judgement', meaning: 'Judgement, rebirth, inner calling, absolution. Answer your calling.' },
  { name: 'The World', meaning: 'Completion, accomplishment, travel, achievement. You have arrived!' }
];

window.drawTarot = function() {
  const card = tarotCards[Math.floor(Math.random() * tarotCards.length)];
  const cardElement = document.getElementById('tarot-card');
  const resultElement = document.getElementById('tarot-result');
  const cardNameElement = document.getElementById('tarot-card-name');
  const cardMeaningElement = document.getElementById('tarot-card-meaning');
  
  if (!cardElement || !resultElement) return;
  
  // Animate card flip
  cardElement.style.transform = 'rotateY(180deg)';
  
  setTimeout(() => {
    cardElement.style.transform = 'rotateY(0deg)';
    cardElement.innerHTML = '<i class="fas fa-star"></i>';
    
    if (cardNameElement) cardNameElement.textContent = card.name;
    if (cardMeaningElement) cardMeaningElement.textContent = card.meaning;
    if (resultElement) resultElement.classList.remove('hidden');
  }, 300);
}

// ===================================
// NUMEROLOGY FUNCTIONS
// ===================================
const numerologyMeanings = {
  1: 'The Leader - You are independent, ambitious, and a natural born leader. Your path is about innovation and courage.',
  2: 'The Peacemaker - You are diplomatic, cooperative, and seek harmony. Your path is about partnership and balance.',
  3: 'The Creative - You are expressive, optimistic, and artistic. Your path is about self-expression and joy.',
  4: 'The Builder - You are practical, hardworking, and organized. Your path is about creating solid foundations.',
  5: 'The Freedom Seeker - You are adventurous, versatile, and love change. Your path is about freedom and experience.',
  6: 'The Nurturer - You are responsible, caring, and family-oriented. Your path is about service and compassion.',
  7: 'The Seeker - You are analytical, spiritual, and introspective. Your path is about wisdom and understanding.',
  8: 'The Powerhouse - You are ambitious, confident, and goal-oriented. Your path is about material success.',
  9: 'The Humanitarian - You are compassionate, generous, and idealistic. Your path is about serving humanity.',
  11: 'The Intuitive - Master number! You are inspirational, intuitive, and visionary. Your path is about spiritual enlightenment.',
  22: 'The Master Builder - Master number! You are the master architect with unlimited potential. Your path is about building legacy.',
  33: 'The Master Teacher - Master number! You are the master of compassion and healing. Your path is about uplifting humanity.'
};

function reduceToSingleDigit(num) {
  // Keep master numbers 11, 22, 33
  if (num === 11 || num === 22 || num === 33) return num;
  
  while (num > 9) {
    num = num.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
    if (num === 11 || num === 22 || num === 33) return num;
  }
  return num;
}

window.calculateNumerology = function() {
  const birthDateInput = document.getElementById('birth-date');
  const resultElement = document.getElementById('numerology-result');
  const lifePathElement = document.getElementById('life-path-number');
  const meaningElement = document.getElementById('numerology-meaning');
  
  if (!birthDateInput || !birthDateInput.value) {
    alert('Please enter your birth date!');
    return;
  }
  
  const date = new Date(birthDateInput.value);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  // Calculate life path number
  const daySum = reduceToSingleDigit(day);
  const monthSum = reduceToSingleDigit(month);
  const yearSum = reduceToSingleDigit(year);
  const lifePathNumber = reduceToSingleDigit(daySum + monthSum + yearSum);
  
  if (lifePathElement) lifePathElement.textContent = lifePathNumber;
  if (meaningElement) meaningElement.textContent = numerologyMeanings[lifePathNumber];
  if (resultElement) resultElement.classList.remove('hidden');
}

// ===================================
// CHECKOUT FUNCTIONS
// ===================================
window.openCheckout = function(packageData) {
  selectedPackage = packageData;
  
  const packageInfo = document.getElementById('checkout-package-info');
  if (packageInfo) {
    packageInfo.innerHTML = `
      <h3 class="text-xl font-bold neon-text mb-2">${packageData.name}</h3>
      <p class="text-gray-300 mb-2">${packageData.description}</p>
      <p class="text-3xl font-bold text-yellow-400">€${packageData.price}</p>
    `;
  }
  
  openModal('checkout-modal');
}

// Checkout form submission
document.addEventListener('DOMContentLoaded', () => {
  const checkoutForm = document.getElementById('checkout-form');
  
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!selectedPackage) {
        alert('Please select a package first!');
        return;
      }
      
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        birthDay: parseInt(formData.get('birthDay')),
        birthMonth: parseInt(formData.get('birthMonth')),
        birthYear: parseInt(formData.get('birthYear')),
        birthTime: formData.get('birthTime') || '00:00',
        birthPlace: formData.get('birthPlace'),
        package: selectedPackage,
        paymentMethod: formData.get('paymentMethod')
      };
      
      // Show loading
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '⏳ Processing...';
      submitBtn.disabled = true;
      
      try {
        const paymentMethod = data.paymentMethod;
        let response;
        
        if (paymentMethod === 'stripe') {
          // Stripe Checkout
          response = await fetch('/api/checkout/stripe/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          const result = await response.json();
          
          if (result.success && result.url) {
            // Redirect to Stripe
            window.location.href = result.url;
          } else {
            throw new Error(result.error || 'Payment failed');
          }
        } else if (paymentMethod === 'revolut') {
          // Revolut Checkout
          response = await fetch('/api/checkout/revolut/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          const result = await response.json();
          
          if (result.success && result.publicId) {
            // Redirect to Revolut
            const revolutUrl = `https://checkout.revolut.com/pay/${result.publicId}`;
            window.location.href = revolutUrl;
          } else {
            throw new Error(result.error || 'Payment failed');
          }
        }
      } catch (error) {
        console.error('Checkout error:', error);
        alert('Payment failed: ' + error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  
  // Load payment config
  loadPaymentConfig();
  handlePaymentReturn();
});

// Load payment configuration
async function loadPaymentConfig() {
  try {
    const res = await fetch('/api/config/payment');
    paymentConfig = await res.json();
    console.log('💳 Payment config loaded:', paymentConfig);
  } catch (e) {
    console.error('Failed to load payment config:', e);
  }
}

// Handle payment return (success/cancelled)
function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('checkout');
  const orderId = params.get('order_id');
  
  if (status === 'success' && orderId) {
    // Fetch order details
    fetch(`/api/orders/${orderId}/status`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const successDetails = document.getElementById('success-order-details');
          if (successDetails) {
            successDetails.innerHTML = `
              <p class="mb-2"><strong>Order Number:</strong> ${data.order.orderNumber}</p>
              <p class="mb-2"><strong>Email:</strong> ${data.order.email}</p>
              <p class="mb-2"><strong>Package:</strong> ${data.order.packageName}</p>
              <p class="text-green-400"><strong>Status:</strong> Confirmed ✅</p>
            `;
          }
          openModal('success-modal');
          // Remove query params
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })
      .catch(e => console.error('Order status fetch failed:', e));
  } else if (status === 'cancelled') {
    alert('❌ Payment was cancelled. You can try again anytime!');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// ===================================
// CHAT WIDGET FUNCTIONS
// ===================================
window.toggleChat = function() {
  const chatBox = document.getElementById('chat-box');
  if (chatBox) {
    chatBox.classList.toggle('active');
  }
}

window.sendChatMessage = function() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  
  if (!input || !messages || !input.value.trim()) return;
  
  const userMessage = input.value.trim();
  
  // Add user message
  const userDiv = document.createElement('div');
  userDiv.className = 'bg-yellow-400 text-black p-3 rounded-lg ml-auto max-w-[80%]';
  userDiv.innerHTML = `<p class="text-sm">${userMessage}</p>`;
  messages.appendChild(userDiv);
  
  input.value = '';
  
  // Auto-scroll
  messages.scrollTop = messages.scrollHeight;
  
  // AI Response (simple keyword matching)
  setTimeout(() => {
    const botResponse = generateBotResponse(userMessage);
    const botDiv = document.createElement('div');
    botDiv.className = 'bg-gray-800 p-3 rounded-lg';
    botDiv.innerHTML = `<p class="text-sm">${botResponse}</p>`;
    messages.appendChild(botDiv);
    messages.scrollTop = messages.scrollHeight;
  }, 500);
}

function generateBotResponse(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
    return '💰 We have 3 packages: Cosmic Awakening (€47), Soul Blueprint (€147), and Destiny Mastery (€397). Each offers different depths of analysis!';
  }
  if (msg.includes('tarot')) {
    return '🔮 Try our FREE Tarot reading above! Just click "Draw a Card" for instant guidance.';
  }
  if (msg.includes('numerology')) {
    return '🔢 Check out our FREE Numerology calculator! Enter your birth date to discover your Life Path Number.';
  }
  if (msg.includes('payment') || msg.includes('pay')) {
    return '💳 We accept Stripe (cards) and Revolut (lower fees at 0.8%). Both are 100% secure!';
  }
  if (msg.includes('delivery') || msg.includes('when')) {
    return '📧 Delivery times: 24h for Cosmic Awakening, 12h for Soul Blueprint (priority), and instant for Destiny Mastery (VIP)!';
  }
  if (msg.includes('birth') || msg.includes('time')) {
    return '⏰ Birth time is important for accuracy! If you don\'t know exact time, morning/afternoon/evening works too.';
  }
  if (msg.includes('hello') || msg.includes('hi')) {
    return '👋 Hello! I\'m here to help with any questions about astrology, pricing, or your cosmic journey!';
  }
  
  // Default response
  return '✨ Great question! Our astrology readings are personalized and AI-powered. Choose a package to get started, or try our free tools above!';
}

// Enter key for chat
document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
});

console.log('✅ All functions loaded successfully!');
