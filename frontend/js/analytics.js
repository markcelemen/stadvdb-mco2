// frontend/js/analytics.js
import { apiCall } from './api.js';

let topProductsChart, salesByCategoryChart, flashSaleChart;

export async function loadTopProducts() {
    const result = await apiCall('/analytics/top-products');

    const labels = result.data.map(p => p.product_name);
    const quantities = result.data.map(p => p.total_quantity_sold);

    const ctx = document.querySelector('#topProductsChart').getContext('2d');

    if (topProductsChart) topProductsChart.destroy();

    topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Quantity Sold',
                data: quantities,
                backgroundColor: 'rgba(75, 192, 192, 0.7)'
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Top 10 Selling Products' } }
        }
    });
}

export async function loadSalesByCategory() {
    const result = await apiCall('/analytics/sales-by-category');

    const labels = result.data.map(c => c.category);
    const sales = result.data.map(c => c.total_sales_amount);

    const ctx = document.querySelector('#salesByCategoryChart').getContext('2d');

    if (salesByCategoryChart) salesByCategoryChart.destroy();

    salesByCategoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: 'Sales Amount',
                data: sales,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Sales by Category' } }
        }
    });
}

export async function loadFlashSalePerformance(flashSaleId = 1) {
    const result = await apiCall(`/analytics/flash-sale/${flashSaleId}`);

    const labels = result.data.map(s => s.t_hour + ':00');
    const quantities = result.data.map(s => s.quantity_sold);

    const ctx = document.querySelector('#flashSaleChart').getContext('2d');

    if (flashSaleChart) flashSaleChart.destroy();

    flashSaleChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Quantity Sold',
                data: quantities,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: `Flash Sale Performance (ID: ${flashSaleId})` } }
        }
    });
}

// Automatically load all charts
document.addEventListener('DOMContentLoaded', async () => {
    await loadTopProducts();
    await loadSalesByCategory();
    await loadFlashSalePerformance();
});