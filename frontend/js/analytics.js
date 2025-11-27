// frontend/js/analytics.js
import { apiCall } from './api.js';

let topProductsChart, salesByCategoryChart, hourlySalesChart;

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
            maintainAspectRatio: false,
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
            maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'Sales by Category' } }
        }
    });
}

export async function loadHourlySales() {
    const result = await apiCall("/analytics/hourly-sales");
    const data = result.data;

    // Initialize arrays for all 24 hours
    const values = Array(24).fill(0);
    const count = Array(24).fill(0); // optional if you want averages

    // Fill in sales data
    data.forEach(d => {
        const hour = d.t_hour;
        values[hour] += d.avg_sales; // if API already gives avg, this is fine
        count[hour] += 1;
    });

    // If API is giving totals instead of averages, uncomment:
    // for (let i = 0; i < 24; i++) {
    //     if (count[i] > 0) values[i] = values[i] / count[i];
    // }

    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    const ctx = document.getElementById("hourlySalesChart").getContext("2d");

    if (hourlySalesChart) hourlySalesChart.destroy();

    hourlySalesChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Average Sales per Hour",
                data: values,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: "Hourly Average Sales" }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}