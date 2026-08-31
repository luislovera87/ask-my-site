import { products } from '../data/products.js';

const formatPrice = (n) => `$${n.toFixed(2)}`;

export function renderCatalog(container) {
  container.innerHTML = `
    <div class="grid">
      ${products
        .map(
          (p) => `
        <article class="card" data-product-id="${p.id}">
          <div class="card-top">
            <h3>${p.name}</h3>
            <span class="tag">${p.tag}</span>
          </div>
          <p class="desc">${p.description}</p>
          <div class="card-bottom">
            <span class="price">${formatPrice(p.price)}</span>
            <span class="pid">${p.id}</span>
          </div>
        </article>
      `
        )
        .join('')}
    </div>
  `;
}
