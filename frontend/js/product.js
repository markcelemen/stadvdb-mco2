// frontend/products.js
import { apiCall } from './api.js';

export async function loadProducts(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const endpoint = `/products${query ? '?' + query : ''}`;
    const result = await apiCall(endpoint);
    displayProducts(result.data);
}

function displayProducts(products) {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;
    grid.innerHTML = products.map(p => `
        <div class="product-card" data-product-id="${p.id}">
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.currentPrice}₱</div>
            <button onclick="window.addToCart(${p.id})">Add to Cart</button>
        </div>
    `).join('');
}