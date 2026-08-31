import { products } from '../data/products.js';
import { addToCart, searchProducts } from '../state.js';

const formatPrice = (n) => `$${n.toLocaleString('en-US')}`;

const ICONS = {
  weapon: `<path d="M12 2 L12 15" /><path d="M7 6 H17" /><path d="M10 15 H14 L13 19 H11 Z" /><path d="M12 19 V22" />`,
  costume: `<path d="M12 3 C9 3 8 5 8 6 L5 20 Q12 23 19 20 L16 6 C16 5 15 3 12 3 Z" /><circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none"/>`,
  headwear: `<ellipse cx="12" cy="17" rx="9" ry="2.2" /><path d="M7 17 L8.5 8 Q12 6 15.5 8 L17 17" />`,
  eyewear: `<circle cx="6.5" cy="13" r="3.5" /><circle cx="17.5" cy="13" r="3.5" /><path d="M10 13 H14" /><path d="M3 12 L1.5 10" /><path d="M21 12 L22.5 10" />`,
  vehicle: `<path d="M3 16 L4.5 10 Q6 8 9 8 H15 Q18 8 19.5 10 L21 16" /><path d="M2 16 H22 V18 H2 Z" /><circle cx="7" cy="18.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="17" cy="18.5" r="1.6" fill="currentColor" stroke="none"/>`,
  prop: `<path d="M6 4 H18 V20 Q15 18 12 20 Q9 18 6 20 Z" /><path d="M9 8 H15 M9 11 H15 M9 14 H13" />`,
  jewelry: `<circle cx="12" cy="15" r="5" /><path d="M9.5 10 L12 4 L14.5 10" />`,
};

const CATEGORY_LABELS = {
  weapon: 'Weapons',
  costume: 'Costumes',
  headwear: 'Headwear',
  eyewear: 'Eyewear',
  vehicle: 'Vehicles',
  prop: 'Props',
  jewelry: 'Jewelry',
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS);
export const CATEGORY_LABEL_MAP = CATEGORY_LABELS;

function categoryLabel(tag) {
  return CATEGORY_LABELS[tag] ?? tag;
}

function icon(tag) {
  return `<svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" data-tag="${tag}" aria-hidden="true">${ICONS[tag] ?? ''}</svg>`;
}

function cardTemplate(p) {
  return `
    <article class="card" data-product-id="${p.id}" data-tag="${p.tag}">
      <div class="card-media" data-tag="${p.tag}">
        ${icon(p.tag)}
        <span class="rarity rarity-${p.rarity}">${p.rarity}</span>
      </div>
      <div class="card-body">
        <span class="card-category">${categoryLabel(p.tag)}</span>
        <h3>${p.name}</h3>
        <p class="card-franchise">Inspired by <strong>${p.inspiredBy}</strong></p>
        <p class="desc">${p.description}</p>
        <div class="card-bottom">
          <span class="price">${formatPrice(p.price)}</span>
          <span class="pid">${p.id}</span>
        </div>
        <button type="button" class="add-btn" data-add-id="${p.id}">Add to cart</button>
      </div>
    </article>
  `;
}

export const PAGE_SIZE = 24;

export function renderCatalog(container, { query = '', category = 'all', visibleCount = PAGE_SIZE, onLoadMore } = {}) {
  let list = query ? searchProducts(query) : products;
  if (category !== 'all') {
    list = list.filter((p) => p.tag === category);
  }

  if (list.length === 0) {
    container.innerHTML = `<p class="empty">No props match that search. Try a different word or category.</p>`;
    return;
  }

  const page = list.slice(0, visibleCount);
  const remaining = list.length - page.length;

  container.innerHTML = `
    <p class="result-count">${list.length.toLocaleString('en-US')} item${list.length === 1 ? '' : 's'}${query || category !== 'all' ? ' match your filters' : ' in the vault'}</p>
    <div class="grid">${page.map(cardTemplate).join('')}</div>
    ${
      remaining > 0
        ? `<button type="button" class="load-more-btn" id="load-more">Load ${Math.min(remaining, PAGE_SIZE).toLocaleString('en-US')} more (${remaining.toLocaleString('en-US')} left)</button>`
        : ''
    }
  `;

  container.querySelectorAll('[data-add-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.addId, 1);
      btn.classList.remove('add-btn-flash');
      // Re-trigger the flash animation even on rapid repeat clicks.
      void btn.offsetWidth;
      btn.classList.add('add-btn-flash');
    });
  });

  const loadMoreBtn = container.querySelector('#load-more');
  if (loadMoreBtn && onLoadMore) {
    loadMoreBtn.addEventListener('click', onLoadMore);
  }
}
