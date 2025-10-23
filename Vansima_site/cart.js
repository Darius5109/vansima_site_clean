/* cart.js — drop into your project and include with <script src="cart.js"></script> */
(function(){
  const CART_KEY = 'vansima_cart_v1';

  function safeJSONParse(str){
    try { return JSON.parse(str); } catch(e){ return null; }
  }

  function getCart(){
    return safeJSONParse(localStorage.getItem(CART_KEY)) || [];
  }

  function saveCart(cart){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function parsePrice(price){
    if (typeof price === 'number') return price;
    if (!price) return 0;
    // remove currency symbols and commas, keep negative and decimals
    return parseFloat(String(price).replace(/[^0-9.-]+/g, '')) || 0;
  }

  function addToCart(item){
    const cart = getCart();
    // ensure numeric price and qty
    item.price = parsePrice(item.price);
    item.qty = Math.max(1, parseInt(item.qty || 1, 10));

    // try to merge based on id if provided
    if (item.id) {
      const existing = cart.find(i => i.id === item.id);
      if (existing){
        existing.qty = (existing.qty || 1) + item.qty;
      } else {
        cart.push(item);
      }
    } else {
      // no id -> push a unique item
      item.id = 'p_' + Math.random().toString(36).slice(2,9);
      cart.push(item);
    }

    saveCart(cart);
    return cart;
  }

  function updateCartCount(){
    const cart = getCart();
    const count = cart.reduce((s,i) => s + (i.qty || 1), 0);
    const el = document.querySelector('[data-cart-count]') || document.getElementById('cart-count');
    if (el) el.textContent = count;
  }

  // Attach listeners to .add-to-cart buttons (supports data attributes or DOM fields)
  function attachAddButtons(root=document){
    const buttons = root.querySelectorAll('.add-to-cart');
    buttons.forEach(btn => {
      if (btn.dataset.vBound) return; // avoid double-binding
      btn.dataset.vBound = '1';
      // keep original label for quick feedback reset
      btn.dataset.origLabel = btn.dataset.origLabel || btn.textContent.trim();
      btn.addEventListener('click', function(e){
        e.preventDefault();
        // try to find product container
        const productEl = btn.closest('.product') || btn.closest('[data-product-id]') || btn.parentElement;

        // prefer explicit data attributes on button if present
        const id = btn.dataset.productId || btn.dataset.id || (productEl && productEl.dataset && productEl.dataset.productId) || null;
        const name = btn.dataset.name || (productEl && productEl.querySelector && productEl.querySelector('.product-name') && productEl.querySelector('.product-name').textContent.trim()) || (productEl && productEl.dataset && productEl.dataset.name) || 'Product';
        const priceRaw = btn.dataset.price || (productEl && productEl.querySelector && productEl.querySelector('.product-price') && productEl.querySelector('.product-price').textContent.trim()) || (productEl && productEl.dataset && productEl.dataset.price) || 0;
        const image = btn.dataset.image || (productEl && productEl.querySelector && productEl.querySelector('img') && productEl.querySelector('img').src) || '';
        const qty = parseInt(btn.dataset.qty || (productEl && productEl.querySelector && productEl.querySelector('input.qty') && productEl.querySelector('input.qty').value) || 1, 10) || 1;

        const item = { id, name, price: priceRaw, image, qty };
        addToCart(item);

        // small UI feedback
        btn.textContent = 'Added ✓';
        setTimeout(()=> btn.textContent = btn.dataset.origLabel, 1000);
      });
    });
  }

  // Render cart on cart page. Expects container with id=cart-items and span/id #cart-total
  function renderCart(containerSelector='#cart-items', totalSelector='#cart-total'){
    const container = document.querySelector(containerSelector);
    const totalEl = document.querySelector(totalSelector);
    if (!container) return; // not a cart page
    const cart = getCart();
    container.innerHTML = '';

    if (cart.length === 0){
      container.innerHTML = '<p>Your cart is empty.</p>';
      if (totalEl) totalEl.textContent = '$0.00';
      updateCartCount();
      return;
    }

    let total = 0;
    cart.forEach(item => {
      total += (item.price || 0) * (item.qty || 1);
      const div = document.createElement('div');
      div.className = 'cart-row';
      div.innerHTML = `
        <div class="cart-thumb"><img src="${item.image || ''}" alt="" width="80" onerror="this.style.display='none'"></div>
        <div class="cart-body">
          <div class="cart-name">${item.name}</div>
          <div class="cart-price">$${(item.price || 0).toFixed(2)}</div>
          <div class="cart-qty">Qty: <input type="number" min="1" value="${item.qty || 1}" data-item-id="${item.id}" class="cart-qty-input"></div>
          <div><button class="remove-item" data-item-id="${item.id}">Remove</button></div>
        </div>
        <hr>
      `;
      container.appendChild(div);
    });

    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);

    // wire qty changes
    container.querySelectorAll('.cart-qty-input').forEach(inp => {
      inp.addEventListener('change', function(){
        const id = this.dataset.itemId;
        const newQty = Math.max(1, parseInt(this.value, 10) || 1);
        const cart = getCart();
        const it = cart.find(x => x.id === id);
        if (it) {
          it.qty = newQty;
          saveCart(cart);
          renderCart(containerSelector, totalSelector);
        }
      });
    });

    // wire remove
    container.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', function(){
        const id = this.dataset.itemId;
        let cart = getCart();
        cart = cart.filter(x => x.id !== id);
        saveCart(cart);
        renderCart(containerSelector, totalSelector);
      });
    });

    updateCartCount();
  }

  // expose public API for manual debug/use
  window.VANSIMA_CART = {
    addToCart,
    getCart,
    saveCart,
    attachAddButtons,
    renderCart,
    updateCartCount
  };

  // initialize after DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    attachAddButtons(document);
    updateCartCount();
    renderCart('#cart-items', '#cart-total');
  });
})();
// Checkout button handler

  // Option 1: Redirect to a custom checkout page (e.g., vansima_checkout.html)
  // You can pass cart data via localStorage or query params if needed
  
  // localStorage.setItem('checkout_cart', JSON.stringify(cart));
  // window.location.href = 'vansima_checkout.html';

  // OR Option 2: Direct Stripe checkout (only if you have a Stripe session set up)
  /*
  fetch('/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart })
  })
  .then(res => res.json())
  .then(data => {
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Failed to start checkout');
    }
  })
  .catch(err => console.error(err));
  */
 // Redirect to checkout page
document.getElementById('checkout-button').addEventListener('click', function() {
  const cart = JSON.parse(localStorage.getItem('vansima_cart_v1')) || [];
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  localStorage.setItem('checkout_cart', JSON.stringify(cart));
  window.location.href = 'vansima_checkout.html'; // make sure this matches your actual checkout file name
});
