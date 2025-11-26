// backend/analytics.js
const pool = require('./db'); // import the connection pool

// Report 1: Top 10 Selling Items
async function getTop10SellingItems() {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.product_id,
                p.product_name,
                SUM(f.quantity_sold) AS total_quantity_sold,
                SUM(f.total_sale) AS total_sales_amount
            FROM FactOrders f
            JOIN DimProduct p ON f.product_id = p.product_id
            GROUP BY p.product_id, p.product_name
            ORDER BY total_quantity_sold DESC
            LIMIT 10
        `);
        return rows;
    } catch (error) {
        console.error('Error fetching Top 10 Selling Items:', error);
        throw error;
    }
}

// Report 2: Sales by Product/Category
async function getSalesByCategory() {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.category,
                SUM(f.quantity_sold) AS total_quantity_sold,
                SUM(f.total_sale) AS total_sales_amount
            FROM FactOrders f
            JOIN DimProduct p ON f.product_id = p.product_id
            GROUP BY p.category
            ORDER BY total_sales_amount DESC
        `);
        return rows;
    } catch (error) {
        console.error('Error fetching Sales by Category:', error);
        throw error;
    }
}

// Report 3: Flash Sale Performance
async function getFlashSalePerformance(flashSaleId) {
    try {
        const [flashSale] = await pool.query(`
            SELECT start_time_id, end_time_id
            FROM DimFlashSale
            WHERE flash_sale_id = ?
        `, [flashSaleId]);

        if (flashSale.length === 0) return [];

        const { start_time_id, end_time_id } = flashSale[0];

        const [sales] = await pool.query(`
            SELECT 
                f.product_id,
                p.product_name,
                SUM(f.quantity_sold) AS quantity_sold,
                SUM(f.total_sale) AS total_sales_amount,
                t.t_hour
            FROM FactOrders f
            JOIN DimProduct p ON f.product_id = p.product_id
            JOIN DimTime t ON f.time_id = t.time_id
            WHERE f.flash_sale_id = ?
            AND f.time_id BETWEEN ? AND ?
            GROUP BY f.product_id, p.product_name, t.t_hour
            ORDER BY t.t_hour ASC
        `, [flashSaleId, start_time_id, end_time_id]);

        return sales;
    } catch (error) {
        console.error('Error fetching Flash Sale Performance:', error);
        throw error;
    }
}

// Export functions for routes
module.exports = {
    getTop10SellingItems,
    getSalesByCategory,
    getFlashSalePerformance
};