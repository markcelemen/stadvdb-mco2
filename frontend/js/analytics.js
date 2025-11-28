import { apiCall } from './api.js';

let topProductsChart, salesByCategoryChart, hourlySalesChart;

export async function loadTopProducts(sellerId) {
    console.log('📊 loadTopProducts called with sellerId:', sellerId);
    
    try {
        const response = await fetch(`http://localhost:3000/api/analytics/top-products?sellerId=${sellerId}`);
        const result = await response.json();
        
        console.log('📊 Top products response:', result);
        
        if (!result.success || !result.data || result.data.length === 0) {
            console.warn('⚠️ No top products data found for seller', sellerId);
            return;
        }

        const labels = result.data.map(item => item.product_name);
        const data = result.data.map(item => item.total_quantity_sold);

        console.log('📊 Chart labels:', labels);
        console.log('📊 Chart data:', data);

        const ctx = document.getElementById('topProductsChart');
        if (!ctx) {
            console.error('❌ topProductsChart canvas not found');
            return;
        }

        if (topProductsChart) {
            topProductsChart.destroy();
        }

        topProductsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quantity Sold',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Error loading top products:', error);
    }
}

export async function loadSalesByCategory(sellerId) {
    console.log('📊 loadSalesByCategory called with sellerId:', sellerId);
    
    try {
        const response = await fetch(`http://localhost:3000/api/analytics/sales-by-category?sellerId=${sellerId}`);
        const result = await response.json();
        
        console.log('📊 Sales by category response:', result);

        if (!result.success || !result.data || result.data.length === 0) {
            console.warn('⚠️ No category data found for seller', sellerId);
            return;
        }

        const labels = result.data.map(item => item.category);
        const data = result.data.map(item => parseFloat(item.total_sales_amount));

        console.log('📊 Category labels:', labels);
        console.log('📊 Category data:', data);

        const ctx = document.getElementById('salesByCategoryChart');
        if (!ctx) {
            console.error('❌ salesByCategoryChart canvas not found');
            return;
        }

        if (salesByCategoryChart) {
            salesByCategoryChart.destroy();
        }

        salesByCategoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } catch (error) {
        console.error('❌ Error loading sales by category:', error);
    }
}

export async function loadHourlySales(sellerId) {
    console.log('📊 loadHourlySales called with sellerId:', sellerId);
    
    try {
        const response = await fetch(`http://localhost:3000/api/analytics/hourly-sales?sellerId=${sellerId}`);
        const result = await response.json();
        
        console.log('📊 Hourly sales response:', result);

        if (!result.success || !result.data) {
            console.warn('⚠️ No hourly sales data found for seller', sellerId);
            return;
        }

        const labels = result.data.map(item => `${item.t_hour}:00`);
        const data = result.data.map(item => parseFloat(item.avg_sales) || 0);

        console.log('📊 Hourly labels:', labels);
        console.log('📊 Hourly data:', data);

        const ctx = document.getElementById('hourlySalesChart');
        if (!ctx) {
            console.error('❌ hourlySalesChart canvas not found');
            return;
        }

        if (hourlySalesChart) {
            hourlySalesChart.destroy();
        }

        hourlySalesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Sales per Hour',
                    data: data,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Error loading hourly sales:', error);
    }
}