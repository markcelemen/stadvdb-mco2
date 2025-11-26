// frontend/cart.js
import { apiCall } from './api.js';

export let cart = [];

export async function loadCart(userId) {
    const res = await apiCall(`/cart/${userId}`);
    cart = res.data.items;
    updateCartUI(res.data);
}

export function updateCartUI(cartData) {
    const btn = document.querySelector('.action-btn:last-child span');
    if (btn) btn.textContent = `Cart (${cartData.itemCount})`;
}

export async function addToCart(productId, userId) {
    await apiCall(`/cart/${userId}/add`, 'POST', { productId, quantity: 1 });
    await loadCart(userId);
}