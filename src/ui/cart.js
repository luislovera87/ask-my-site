import { applyDiscount, getCartDetails, removeFromCart, setCartQuantity } from '../state.js';

const formatPrice = (n) => `$${n.toLocaleString('en-US')}`;

function itemRow(item) {
  return `
    <li class="cart-row" data-product-id="${item.productId}">
      <div class="cart-row-main">
        <span class="cart-item-name">${item.product.name}</span>
        <span class="cart-item-price">${formatPrice(item.product.price * item.quantity)}</span>
      </div>
      <div class="cart-row-controls">
        <div class="qty-stepper">
          <button type="button" class="qty-btn" data-qty-down="${item.productId}" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button type="button" class="qty-btn" data-qty-up="${item.productId}" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="remove-btn" data-remove="${item.productId}">Remove</button>
      </div>
    </li>
  `;
}

export function renderCart(container) {
  const { items, subtotal, discount, discountAmount, total } = getCartDetails();

  if (items.length === 0) {
    container.innerHTML = `
      <p class="empty">Your cart is empty. Click "Add to cart" on anything in the collection.</p>
    `;
    return;
  }

  container.innerHTML = `
    <ul class="cart-items">
      ${items.map(itemRow).join('')}
    </ul>
    <form class="discount-form" id="discount-form">
      <input type="text" name="code" placeholder="Discount code" autocomplete="off" ${discount ? 'disabled' : ''} />
      <button type="submit" ${discount ? 'disabled' : ''}>Apply</button>
    </form>
    <p class="discount-status" id="discount-status"></p>
    <div class="cart-totals">
      <div class="row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      ${
        discount
          ? `<div class="row discount-row"><span>Discount (${discount.code}, -${discount.percent}%)</span><span>-${formatPrice(discountAmount)}</span></div>`
          : ''
      }
      <div class="row total-row"><span>Total</span><span>${formatPrice(total)}</span></div>
    </div>
    <button type="button" class="checkout-btn" disabled title="Demo only — nothing ships. See the footer.">
      Proceed to checkout
    </button>
  `;

  container.querySelectorAll('[data-qty-up]').forEach((btn) => {
    const item = items.find((i) => i.productId === btn.dataset.qtyUp);
    btn.addEventListener('click', () => setCartQuantity(item.productId, item.quantity + 1));
  });
  container.querySelectorAll('[data-qty-down]').forEach((btn) => {
    const item = items.find((i) => i.productId === btn.dataset.qtyDown);
    btn.addEventListener('click', () => setCartQuantity(item.productId, item.quantity - 1));
  });
  container.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
  });

  const discountForm = container.querySelector('#discount-form');
  if (discountForm) {
    discountForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const code = new FormData(discountForm).get('code');
      const statusEl = container.querySelector('#discount-status');
      try {
        applyDiscount(code);
      } catch (err) {
        statusEl.textContent = err.message;
        statusEl.dataset.state = 'error';
      }
    });
  }
}
