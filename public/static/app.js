// Cosmic Blueprint - Frontend JavaScript with Stripe + Revolut support

console.log('🚀 Cosmic Blueprint loaded!');

// Payment configuration
let paymentConfig = {
  stripe: null,
  revolut: null
};

// Load payment configuration on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/config/payment');
    const data = await response.json();
    paymentConfig = data;
    console.log('💳 Payment providers configured:', data);
  } catch (error) {
    console.error('Failed to load payment config:', error);
  }
  
  // Check for payment success/failure
  handlePaymentReturn();
});

// Handle return from Stripe/Revolut
function handlePaymentReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const checkoutStatus = urlParams.get('checkout');
  const orderId = urlParams.get('order_id');
  const provider = urlParams.get('provider');
  
  if (checkoutStatus === 'success' && orderId) {
    console.log(`🎉 Payment successful! Order: ${orderId}, Provider: ${provider}`);
    
    // Verify order
    fetch(`/api/orders/${orderId}/status`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(`✅ Order ${data.order.orderNumber} completed!\nEmail: ${data.order.email}\nProvider: ${data.order.provider.toUpperCase()}`);
        }
      })
      .catch(err => console.error('Order verification failed:', err));
      
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
  } else if (checkoutStatus === 'cancelled') {
    console.log('❌ Payment cancelled by user');
    alert('Payment was cancelled. You can try again anytime!');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Example: Create checkout with Stripe
async function createStripeCheckout(orderData) {
  try {
    const response = await fetch('/api/checkout/stripe/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Stripe session created:', data.sessionId);
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    alert('Stripe checkout failed: ' + error.message);
  }
}

// Example: Create checkout with Revolut
async function createRevolutCheckout(orderData) {
  try {
    const response = await fetch('/api/checkout/revolut/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Revolut order created:', data.revolutOrderId);
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Revolut checkout error:', error);
    alert('Revolut checkout failed: ' + error.message);
  }
}

// Example usage:
// const orderData = {
//   name: "John Doe",
//   email: "john@example.com",
//   birthDay: 15,
//   birthMonth: 6,
//   birthYear: 1990,
//   birthTime: "14:30",
//   birthPlace: "New York, USA",
//   package: {
//     name: "Soul Blueprint",
//     price: 147,
//     description: "Complete analysis"
//   }
// };
// 
// createStripeCheckout(orderData);
// or
// createRevolutCheckout(orderData);

console.log('📦 Payment functions ready: createStripeCheckout(), createRevolutCheckout()');
