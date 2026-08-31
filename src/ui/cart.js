import { getCartDetails } from '../state.js';

const formatPrice = (n) => `$${n.toFixed(2)}`;

export function renderCart(container) {
  const { items, subtotal, discount, discountAmount, total } = getCartDetails();

  if (items.length === 0) {
    container.innerHTML = `
      <p class="empty">Cart is empty. Ask the agent to add something, or call a tool from the dev console below.</p>
    `;
    return;
  }

  container.innerHTML = `
    <ul class="cart-items">
      ${items
        .map(
          (item) => `
        <li>
          <span class="cart-item-name">${item.product.name}</span>
          <span class="cart-item-qty">x${item.quantity}</span>
          <span class="cart-item-price">${formatPrice(item.product.price * item.quantity)}</span>
        </li>
      `
        )
        .join('')}
    </ul>
    <div class="cart-totals">
      <div class="row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      ${
        discount
          ? `<div class="row discount-row"><span>Discount (${discount.code}, -${discount.percent}%)</span><span>-${formatPrice(discountAmount)}</span></div>`
          : ''
      }
      <div class="row total-row"><span>Total</span><span>${formatPrice(total)}</span></div>
    </div>
  `;
}
