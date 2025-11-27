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

// Report 3: Hourly sales
// backend/analytics.js
async function getHourlySales() {
    try {
        const [rows] = await pool.query(`
            SELECT h.hour AS t_hour,
                COALESCE(AVG(f.total_sale), 0) AS avg_sales
            FROM (SELECT 0 AS hour UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
                UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
                UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
                UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
                UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
                UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23) h
            LEFT JOIN DimTime t ON t.t_hour = h.hour
            LEFT JOIN FactOrders f ON f.time_id = t.time_id
            GROUP BY h.hour
            ORDER BY h.hour;
        `);
        return rows;
    } catch (error) {
        console.error('Error fetching hourly average sales:', error);
        throw error;
    }
}

// Export functions for routes
module.exports = {
    getTop10SellingItems,
    getSalesByCategory,
    getHourlySales
};