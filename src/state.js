import { products } from './data/products.js';

const state = {
  cart: [], // { productId, quantity }
  discount: null, // { code, percent } | null
  activityLog: [], // { id, timestamp, tool, args, result, isError }
};

const listeners = new Set();
let nextLogId = 1;

function notify() {
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function findProduct(productId) {
  return products.find((p) => p.id === productId) ?? null;
}

export function searchProducts(query) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q)
  );
}

export function addToCart(productId, quantity) {
  const product = findProduct(productId);
  if (!product) {
    throw new Error(`No product with id "${productId}"`);
  }
  const qty = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
  const existing = state.cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    state.cart.push({ productId, quantity: qty });
  }
  notify();
  return { product, quantity: qty };
}

export function applyDiscount(code) {
  const normalized = (code ?? '').trim().toUpperCase();
  if (normalized === 'SAVE10') {
    state.discount = { code: normalized, percent: 10 };
    notify();
    return state.discount;
  }
  throw new Error(`Discount code "${code}" is not valid`);
}

export function getCartDetails() {
  const items = state.cart.map((item) => ({
    ...item,
    product: findProduct(item.productId),
  }));
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = state.discount ? (subtotal * state.discount.percent) / 100 : 0;
  const total = subtotal - discountAmount;
  return { items, subtotal, discount: state.discount, discountAmount, total };
}

export function logActivity({ tool, args, result, isError }) {
  const entry = {
    id: nextLogId++,
    timestamp: new Date(),
    tool,
    args,
    result,
    isError: Boolean(isError),
  };
  state.activityLog.unshift(entry);
  notify();
  return entry;
}

export function getState() {
  return state;
}
