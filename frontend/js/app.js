// frontend/app.js
import { loadProducts } from './products.js';
import { currentUser, updateUserUI } from './auth.js';
import { loadTopProducts, loadSalesByCategory, loadFlashSalePerformance } from './analytics.js';

document.addEventListener('DOMContentLoaded', async () => {
    updateUserUI();
    await loadProducts({ flashSale: true });

    // Load analytics dashboards
    await loadTopProducts();
    await loadSalesByCategory();
    await loadFlashSalePerformance();
});