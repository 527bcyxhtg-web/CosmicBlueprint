// Cosmic Blueprint - Complete Frontend JavaScript v2.0
console.log('🚀 Cosmic Blueprint v2.0 Loaded!');

let paymentConfig = { stripe: null, revolut: null };
let selectedPackage = null;
let yourSign = null;
let partnerSign = null;

// ===================================
// ZODIAC DATA
// ===================================
const zodiacSigns = [
  { name: 'Aries', icon: '♈', dates: 'Mar 21 - Apr 19' },
  { name: 'Taurus', icon: '♉', dates: 'Apr 20 - May 20' },
  { name: 'Gemini', icon: '♊', dates: 'May 21 - Jun 20' },
  { name: 'Cancer', icon: '♋', dates: 'Jun 21 - Jul 22' },
  { name: 'Leo', icon: '♌', dates: 'Jul 23 - Aug 22' },
  { name: 'Virgo', icon: '♍', dates: 'Aug 23 - Sep 22' },
  { name: 'Libra', icon: '♎', dates: 'Sep 23 - Oct 22' },
  { name: 'Scorpio', icon: '♏', dates: 'Oct 23 - Nov 21' },
  { name: 'Sagittarius', icon: '♐', dates: 'Nov 22 - Dec 21' },
  { name: 'Capricorn', icon: '♑', dates: 'Dec 22 - Jan 19' },
  { name: 'Aquarius', icon: '♒', dates: 'Jan 20 - Feb 18' },
  { name: 'Pisces', icon: '♓', dates: 'Feb 19 - Mar 20' }
];

// Compatibility matrix - consistent results for each combination
const compatibilityMatrix = {
  'Aries-Aries': { score: 75, text: 'Two Aries together create an intense, passionate bond! You both share incredible energy, ambition, and love for adventure. Your free preview shows strong physical chemistry and mutual respect for independence. However, both being natural leaders can create power struggles.' },
  'Aries-Taurus': { score: 60, text: 'Aries brings excitement while Taurus offers stability. This preview reveals initial attraction through opposite energies. Aries\' impulsiveness meets Taurus\' patience, creating interesting dynamics. Different paces in life can be both challenging and complementary.' },
  'Aries-Gemini': { score: 85, text: 'Explosive compatibility! This preview shows you both thrive on excitement, spontaneity, and new experiences. Gemini matches Aries\' energy with intellectual stimulation. Communication flows naturally, and boredom is never an issue between you two.' },
  'Aries-Cancer': { score: 55, text: 'Fire meets water in this combination. Your preview indicates Aries\' boldness can initially attract Cancer\'s nurturing nature. However, emotional needs differ significantly - Aries seeks independence while Cancer craves security and closeness.' },
  'Aries-Leo': { score: 95, text: 'Powerhouse pairing! This free analysis shows two fire signs creating spectacular passion and mutual admiration. You both love adventure, romance, and being in the spotlight. Natural chemistry and shared enthusiasm make this a thrilling match.' },
  'Aries-Virgo': { score: 50, text: 'Challenging but growth-oriented match. Preview reveals Aries\' spontaneity clashes with Virgo\'s need for planning. Aries acts first, Virgo analyzes everything. Different approaches to life require significant compromise and understanding.' },
  'Aries-Libra': { score: 70, text: 'Opposite signs attract! This preview shows initial magnetic pull between Aries\' directness and Libra\'s charm. Aries leads, Libra balances. Differences in decision-making speed and social needs create both tension and growth opportunities.' },
  'Aries-Scorpio': { score: 65, text: 'Intense and transformative connection! Preview indicates powerful physical chemistry and mutual fascination. Both are passionate but express differently - Aries openly, Scorpio mysteriously. Power dynamics require careful navigation.' },
  'Aries-Sagittarius': { score: 90, text: 'Adventure soulmates! Your free preview reveals incredible compatibility in values, lifestyle, and outlook. Both fire signs share love for freedom, exploration, and spontaneity. Natural understanding and genuine friendship form the foundation.' },
  'Aries-Capricorn': { score: 58, text: 'Ambitious pair with different timelines. Preview shows both are goal-oriented but Aries wants success now while Capricorn plays the long game. Aries\' impulsiveness meets Capricorn\'s caution, creating friction but also balance.' },
  'Aries-Aquarius': { score: 80, text: 'Progressive and exciting match! This analysis reveals you both value independence and innovation. Aries\' action-oriented nature complements Aquarius\' visionary thinking. Mutual respect for personal space and shared idealism create harmony.' },
  'Aries-Pisces': { score: 52, text: 'Fire and water create steam! Preview indicates Aries\' directness can overwhelm sensitive Pisces. Aries charges ahead while Pisces goes with the flow. Different emotional speeds and communication styles require patience from both sides.' }
};

// Generate all combinations
function generateCompatibilityData() {
  const data = {};
  zodiacSigns.forEach((sign1, i) => {
    zodiacSigns.forEach((sign2, j) => {
      const key = `${sign1.name}-${sign2.name}`;
      const reverseKey = `${sign2.name}-${sign1.name}`;
      
      if (compatibilityMatrix[key]) {
        data[key] = compatibilityMatrix[key];
      } else if (compatibilityMatrix[reverseKey]) {
        data[key] = compatibilityMatrix[reverseKey];
      } else if (sign1.name === sign2.name && !data[key]) {
        // Same sign already defined in matrix
      } else {
        // Generate based on elements
        const score = calculateElementCompatibility(sign1.name, sign2.name);
        data[key] = {
          score,
          text: `Your preview shows ${score}% compatibility between ${sign1.name} and ${sign2.name}. Both signs bring unique strengths to the relationship. Understanding each other's core needs and communication styles is key to harmony.`
        };
      }
    });
  });
  return data;
}

function calculateElementCompatibility(sign1, sign2) {
  const elements = {
    'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
    'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
    'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
    'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
  };
  
  const el1 = elements[sign1];
  const el2 = elements[sign2];
  
  if (el1 === el2) return 75; // Same element
  if ((el1 === 'fire' && el2 === 'air') || (el1 === 'air' && el2 === 'fire')) return 85;
  if ((el1 === 'earth' && el2 === 'water') || (el1 === 'water' && el2 === 'earth')) return 80;
  if ((el1 === 'fire' && el2 === 'earth') || (el1 === 'earth' && el2 === 'fire')) return 55;
  if ((el1 === 'air' && el2 === 'water') || (el1 === 'water' && el2 === 'air')) return 60;
  if ((el1 === 'fire' && el2 === 'water') || (el1 === 'water' && el2 === 'fire')) return 50;
  return 65;
}

const allCompatibilityData = generateCompatibilityData();

// ===================================
// INITIALIZE ZODIAC GRIDS
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  initializeZodiacGrids();
  loadPaymentConfig();
  handlePaymentReturn();
  
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }
  
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });
  }
});

function initializeZodiacGrids() {
  const yourGrid = document.getElementById('your-sign-grid');
  const partnerGrid = document.getElementById('partner-sign-grid');
  
  if (!yourGrid || !partnerGrid) return;
  
  zodiacSigns.forEach(sign => {
    // Your sign
    const yourDiv = createZodiacButton(sign, 'your');
    yourGrid.appendChild(yourDiv);
    
    // Partner sign
    const partnerDiv = createZodiacButton(sign, 'partner');
    partnerGrid.appendChild(partnerDiv);
  });
}

function createZodiacButton(sign, type) {
  const div = document.createElement('div');
  div.className = 'zodiac-sign';
  div.innerHTML = `
    <div class="zodiac-icon">${sign.icon}</div>
    <div class="zodiac-name">${sign.name}</div>
  `;
  div.onclick = () => selectZodiacSign(sign, type, div);
  return div;
}

function selectZodiacSign(sign, type, element) {
  if (type === 'your') {
    document.querySelectorAll('#your-sign-grid .zodiac-sign').forEach(el => el.classList.remove('selected'));
    yourSign = sign;
  } else {
    document.querySelectorAll('#partner-sign-grid .zodiac-sign').forEach(el => el.classList.remove('selected'));
    partnerSign = sign;
  }
  element.classList.add('selected');
}

// ===================================
// COMPATIBILITY CALCULATOR
// ===================================
window.calculateCompatibility = function() {
  if (!yourSign || !partnerSign) {
    alert('Please select both zodiac signs!');
    return;
  }
  
  const key = `${yourSign.name}-${partnerSign.name}`;
  const compat = allCompatibilityData[key];
  
  const resultDiv = document.getElementById('compatibility-result');
  const scoreDiv = document.getElementById('compatibility-score');
  const sign1Div = document.getElementById('compat-sign1');
  const sign2Div = document.getElementById('compat-sign2');
  const barDiv = document.getElementById('compat-bar');
  const textDiv = document.getElementById('compat-free-text');
  
  if (!resultDiv) return;
  
  scoreDiv.textContent = compat.score + '%';
  sign1Div.textContent = `${yourSign.icon} ${yourSign.name}`;
  sign2Div.textContent = `${partnerSign.icon} ${partnerSign.name}`;
  textDiv.textContent = compat.text;
  
  resultDiv.style.display = 'block';
  barDiv.style.width = '0%';
  
  setTimeout(() => {
    barDiv.style.width = compat.score + '%';
  }, 100);
  
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===================================
// TAROT FUNCTIONS
// ===================================
const tarotCards = [
  { name: 'The Fool', icon: '🃏', meaning: 'New beginnings, innocence, spontaneity. A fresh start awaits you! Step into the unknown with courage and trust the journey ahead. This is your time to take a leap of faith.' },
  { name: 'The Magician', icon: '🎩', meaning: 'Manifestation, resourcefulness, power. You have all the tools you need to create your reality. Channel your energy and skills into bringing your desires to life. The universe supports your ambitions.' },
  { name: 'The High Priestess', icon: '🔮', meaning: 'Intuition, sacred knowledge, divine feminine. Trust your inner voice and the wisdom that lies within. Pay attention to your dreams and subconscious messages. Secrets will be revealed.' },
  { name: 'The Empress', icon: '👑', meaning: 'Femininity, beauty, nature, abundance. Creativity flows through you like a river. Nurture your dreams and watch them bloom. This is a time of growth, fertility, and sensual pleasures.' },
  { name: 'The Emperor', icon: '⚔️', meaning: 'Authority, structure, control, father figure. Take charge of your life with wisdom and strength. Establish order and boundaries. Your leadership skills are being called upon.' },
  { name: 'The Lovers', icon: '💕', meaning: 'Love, harmony, relationships, values alignment. Important choices await regarding matters of the heart. This card speaks of deep connections, passion, and the power of unity.' },
  { name: 'The Chariot', icon: '🏇', meaning: 'Control, willpower, success, determination. Victory is within reach! Push forward with confidence and overcome obstacles through sheer determination. Your goals are achievable.' },
  { name: 'Strength', icon: '🦁', meaning: 'Courage, persuasion, influence, compassion. Inner strength prevails over outer challenges. Face your fears with grace and patience. True power comes from gentle mastery.' },
  { name: 'The Hermit', icon: '🕯️', meaning: 'Soul searching, introspection, inner guidance. Time for reflection and solitude. Seek wisdom within yourself. The answers you need are found in stillness and meditation.' },
  { name: 'Wheel of Fortune', icon: '☸️', meaning: 'Good luck, karma, life cycles, destiny. Change is coming! Embrace the turning of fate\'s wheel. What goes up must come down, and what\'s down will rise again. Trust the cycle.' },
  { name: 'Justice', icon: '⚖️', meaning: 'Justice, fairness, truth, cause and effect. Balance will be restored. Truth shall prevail. Legal matters or karmic debts are being resolved. Make decisions with integrity.' },
  { name: 'The Hanged Man', icon: '🙃', meaning: 'Pause, surrender, letting go, new perspective. Release control and see from a different angle. Sometimes doing nothing is the most powerful action. Surrender to gain enlightenment.' },
  { name: 'Death', icon: '💀', meaning: 'Endings, change, transformation, transition. Embrace the new chapter! Rebirth follows every ending. Let go of what no longer serves you to make room for amazing new beginnings.' },
  { name: 'Temperance', icon: '🍷', meaning: 'Balance, moderation, patience, purpose. Find your middle path. Blend opposing forces harmoniously. Practice patience and moderation in all things. Healing comes through balance.' },
  { name: 'The Devil', icon: '😈', meaning: 'Shadow self, attachment, addiction, restriction. Break free from chains that bind you! Examine your addictions and unhealthy patterns. Liberation comes from facing your shadow.' },
  { name: 'The Tower', icon: '🏰', meaning: 'Sudden change, upheaval, chaos, revelation. Breakthrough coming! Destruction leads to liberation. Sometimes things must fall apart to be rebuilt stronger. Embrace the chaos.' },
  { name: 'The Star', icon: '⭐', meaning: 'Hope, faith, purpose, renewal, spirituality. Your wishes will manifest! Keep faith in the divine plan. Healing, inspiration, and spiritual guidance surround you now.' },
  { name: 'The Moon', icon: '🌙', meaning: 'Illusion, fear, anxiety, subconscious. Trust the journey through darkness. Your intuition guides you. Face your fears and trust your instincts. Not all is as it seems.' },
  { name: 'The Sun', icon: '☀️', meaning: 'Positivity, fun, warmth, success, vitality. Joy is yours! Bask in the radiance of achievement and happiness. Success, clarity, and optimism shine upon you. Celebrate life!' },
  { name: 'Judgement', icon: '📯', meaning: 'Judgement, rebirth, inner calling, absolution. Answer your calling! Rise to your higher purpose. Past actions are being evaluated. Forgiveness and redemption are possible.' },
  { name: 'The World', icon: '🌍', meaning: 'Completion, accomplishment, travel, achievement. You have arrived! Celebrate your journey\'s fulfillment. One cycle ends as another begins. Success and recognition are yours.' }
];

window.drawTarot = function() {
  const card = tarotCards[Math.floor(Math.random() * tarotCards.length)];
  const cardElement = document.getElementById('tarot-card');
  const iconElement = document.getElementById('tarot-icon');
  const nameElement = document.getElementById('tarot-name');
  const resultElement = document.getElementById('tarot-result');
  const resultNameElement = document.getElementById('tarot-result-name');
  const resultMeaningElement = document.getElementById('tarot-result-meaning');
  
  if (!cardElement) return;
  
  // Flip the card
  cardElement.classList.add('flipped');
  
  setTimeout(() => {
    if (iconElement) iconElement.textContent = card.icon;
    if (nameElement) nameElement.textContent = card.name;
    if (resultNameElement) resultNameElement.textContent = card.name;
    if (resultMeaningElement) resultMeaningElement.textContent = card.meaning;
    if (resultElement) resultElement.style.display = 'block';
    
    // Flip back after 4 seconds
    setTimeout(() => {
      cardElement.classList.remove('flipped');
    }, 4000);
  }, 400);
}

// ===================================
// NUMEROLOGY FUNCTIONS
// ===================================
const numerologyMeanings = {
  1: 'The Leader - You are independent, ambitious, and a natural born leader. Your path is about innovation, courage, and pioneering new frontiers. You thrive when taking initiative.',
  2: 'The Peacemaker - You are diplomatic, cooperative, and seek harmony in all things. Your path is about partnership, balance, and bringing people together. Relationships are your strength.',
  3: 'The Creative - You are expressive, optimistic, and naturally artistic. Your path is about self-expression, joy, and creative manifestation. You inspire others with your enthusiasm.',
  4: 'The Builder - You are practical, hardworking, and incredibly organized. Your path is about creating solid foundations and lasting structures. Discipline and dedication are your superpowers.',
  5: 'The Freedom Seeker - You are adventurous, versatile, and love change. Your path is about freedom, experience, and embracing life\'s adventures. Variety keeps your spirit alive.',
  6: 'The Nurturer - You are responsible, caring, and deeply family-oriented. Your path is about service, compassion, and creating harmony. You naturally heal and nurture others.',
  7: 'The Seeker - You are analytical, spiritual, and deeply introspective. Your path is about wisdom, understanding, and seeking truth. You find answers through contemplation.',
  8: 'The Powerhouse - You are ambitious, confident, and goal-oriented. Your path is about material success, abundance, and personal power. Achievement comes naturally to you.',
  9: 'The Humanitarian - You are compassionate, generous, and idealistic. Your path is about serving humanity and making the world better. You see the bigger picture.',
  11: 'The Intuitive - Master number! You are inspirational, intuitive, and naturally visionary. Your path is about spiritual enlightenment and inspiring others. You channel divine wisdom.',
  22: 'The Master Builder - Master number! You are the master architect with unlimited potential. Your path is about building legacy and manifesting dreams on a grand scale.',
  33: 'The Master Teacher - Master number! You are the master of compassion and healing. Your path is about uplifting humanity through teaching, healing, and unconditional love.'
};

function reduceToSingleDigit(num) {
  if (num === 11 || num === 22 || num === 33) return num;
  while (num > 9) {
    num = num.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
    if (num === 11 || num === 22 || num === 33) return num;
  }
  return num;
}

window.calculateNumerology = function() {
  const birthDateInput = document.getElementById('birth-date');
  if (!birthDateInput || !birthDateInput.value) {
    alert('Please enter your birth date!');
    return;
  }
  
  const date = new Date(birthDateInput.value);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  const daySum = reduceToSingleDigit(day);
  const monthSum = reduceToSingleDigit(month);
  const yearSum = reduceToSingleDigit(year);
  const lifePathNumber = reduceToSingleDigit(daySum + monthSum + yearSum);
  
  const numberElement = document.getElementById('life-path-number');
  const meaningElement = document.getElementById('numerology-meaning');
  const resultElement = document.getElementById('numerology-result');
  
  if (numberElement) numberElement.textContent = lifePathNumber;
  if (meaningElement) meaningElement.textContent = numerologyMeanings[lifePathNumber];
  if (resultElement) resultElement.style.display = 'block';
}

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
// CHECKOUT FUNCTIONS
// ===================================
window.openCheckout = function(packageData) {
  selectedPackage = packageData;
  const packageInfo = document.getElementById('checkout-package-info');
  if (packageInfo) {
    packageInfo.innerHTML = `
      <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;" class="neon-text">${packageData.name}</h3>
      <p style="color: #aaa; margin-bottom: 10px;">${packageData.description}</p>
      <p style="font-size: 32px; font-weight: bold; color: #ffd700;">€${packageData.price}</p>
    `;
  }
  openModal('checkout-modal');
}

async function handleCheckoutSubmit(e) {
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
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '⏳ Processing...';
  submitBtn.disabled = true;
  
  try {
    const paymentMethod = data.paymentMethod;
    let response;
    
    if (paymentMethod === 'stripe') {
      response = await fetch('/api/checkout/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } else if (paymentMethod === 'revolut') {
      response = await fetch('/api/checkout/revolut/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (result.success && result.publicId) {
        window.location.href = `https://checkout.revolut.com/pay/${result.publicId}`;
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
}

async function loadPaymentConfig() {
  try {
    const res = await fetch('/api/config/payment');
    paymentConfig = await res.json();
    console.log('💳 Payment config loaded');
  } catch (e) {
    console.error('Config load failed:', e);
  }
}

function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('checkout');
  const orderId = params.get('order_id');
  
  if (status === 'success' && orderId) {
    fetch(`/api/orders/${orderId}/status`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const detailsDiv = document.getElementById('success-order-details');
          if (detailsDiv) {
            detailsDiv.innerHTML = `
              <p style="margin-bottom: 10px;"><strong>Order:</strong> ${data.order.orderNumber}</p>
              <p style="margin-bottom: 10px;"><strong>Email:</strong> ${data.order.email}</p>
              <p style="margin-bottom: 10px;"><strong>Package:</strong> ${data.order.packageName}</p>
              <p style="color: #4caf50;"><strong>Status:</strong> Confirmed ✅</p>
            `;
          }
          openModal('success-modal');
        }
      })
      .catch(e => console.error('Order fetch failed:', e));
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (status === 'cancelled') {
    alert('❌ Payment cancelled');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// ===================================
// CHAT WIDGET
// ===================================
window.toggleChat = function() {
  const chatBox = document.getElementById('chat-box');
  if (chatBox) chatBox.classList.toggle('active');
}

window.sendChatMessage = function() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  
  if (!input || !messages || !input.value.trim()) return;
  
  const userMessage = input.value.trim();
  const userDiv = document.createElement('div');
  userDiv.style.cssText = 'background: var(--neon); color: #000; padding: 12px; border-radius: 12px; margin-bottom: 10px; margin-left: auto; max-width: 80%;';
  userDiv.innerHTML = `<p style="font-size: 14px;">${userMessage}</p>`;
  messages.appendChild(userDiv);
  
  input.value = '';
  messages.scrollTop = messages.scrollHeight;
  
  setTimeout(() => {
    const botResponse = generateBotResponse(userMessage);
    const botDiv = document.createElement('div');
    botDiv.style.cssText = 'background: #2a2a2a; padding: 12px; border-radius: 12px; margin-bottom: 10px;';
    botDiv.innerHTML = `<p style="font-size: 14px;">${botResponse}</p>`;
    messages.appendChild(botDiv);
    messages.scrollTop = messages.scrollHeight;
  }, 500);
}

function generateBotResponse(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('compatibility') || msg.includes('match')) {
    return '💕 Try our FREE Compatibility Calculator above! Select your zodiac signs and see your cosmic connection instantly.';
  }
  if (msg.includes('price') || msg.includes('cost')) {
    return '💰 Packages: Cosmic Awakening (€47), Soul Blueprint (€147), Destiny Mastery (€397). Each offers different depth!';
  }
  if (msg.includes('tarot')) {
    return '🔮 Try our FREE Tarot reading! Just click "Draw a Card" for instant guidance.';
  }
  if (msg.includes('numerology')) {
    return '🔢 Calculate your FREE Life Path Number above! Just enter your birth date.';
  }
  if (msg.includes('payment')) {
    return '💳 We accept Stripe (cards) and Revolut (lower fees - 0.8%). Both 100% secure!';
  }
  
  return '✨ I can help with compatibility, tarot, numerology, pricing, or your cosmic reading! What interests you most?';
}

console.log('✅ All functions initialized successfully!');
