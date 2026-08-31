import { toolsReady } from './webmcp/tools.js';
import { subscribe, getState } from './state.js';
import { renderCatalog, CATEGORIES, CATEGORY_LABEL_MAP, PAGE_SIZE } from './ui/catalog.js';
import { renderCart } from './ui/cart.js';
import { products } from './data/products.js';

const catalogEl = document.getElementById('catalog');
const cartEl = document.getElementById('cart');
const cartCountEl = document.getElementById('cart-count');
const searchInput = document.getElementById('catalog-search');
const filterBar = document.getElementById('category-filters');
const heroCountEl = document.getElementById('hero-count');

const filterState = { query: '', category: 'all', visibleCount: PAGE_SIZE };

function renderCatalogWithFilters() {
  renderCatalog(catalogEl, {
    ...filterState,
    onLoadMore: () => {
      filterState.visibleCount += PAGE_SIZE;
      renderCatalogWithFilters();
    },
  });
}

if (heroCountEl) {
  heroCountEl.textContent = products.length.toLocaleString('en-US');
}

function renderCartCount() {
  const count = getState().cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = String(count);
  cartCountEl.hidden = count === 0;
}

function renderAll() {
  renderCart(cartEl);
  renderCartCount();
}

renderCatalogWithFilters();
renderAll();
subscribe(renderAll);

// Tools register silently in the background — see src/webmcp/tools.js.
// Nothing about this is surfaced in the UI; the page reads as a plain storefront.
toolsReady.catch((err) => {
  console.error('Failed to register WebMCP tools:', err);
});

searchInput.addEventListener('input', () => {
  filterState.query = searchInput.value;
  filterState.visibleCount = PAGE_SIZE;
  renderCatalogWithFilters();
});

filterBar.innerHTML = ['all', ...CATEGORIES]
  .map(
    (cat) =>
      `<button type="button" class="chip ${cat === 'all' ? 'chip-active' : ''}" data-category="${cat}">${
        cat === 'all' ? 'All' : CATEGORY_LABEL_MAP[cat]
      }</button>`
  )
  .join('');

filterBar.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-category]');
  if (!btn) return;
  filterState.category = btn.dataset.category;
  filterState.visibleCount = PAGE_SIZE;
  filterBar
    .querySelectorAll('.chip')
    .forEach((chip) => chip.classList.toggle('chip-active', chip === btn));
  renderCatalogWithFilters();
});

document.getElementById('cart-link').addEventListener('click', (event) => {
  event.preventDefault();
  document.getElementById('cart-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
