const { olapPool } = require('./db/pool'); // ✅ Use olapPool instead of pool

// Report 1: Top 10 Selling Items
async function getTop10SellingItems(sellerId) {
    try {
        const [rows] = await olapPool.query(`
            SELECT 
                p.product_name,
                SUM(f.quantity_sold) AS total_quantity_sold
            FROM FactOrders f
            JOIN DimProduct p ON f.product_id = p.product_id
            WHERE f.seller_id = ?
            GROUP BY f.product_id, p.product_name
            ORDER BY total_quantity_sold DESC
            LIMIT 10
        `, [sellerId]);
        return rows;
    } catch (error) {
        console.error('Error fetching Top 10 Selling Items:', error);
        throw error;
    }
}

// Report 2: Sales by Product/Category
async function getSalesByCategory(sellerId) {
    try {
        const [rows] = await olapPool.query(`
            SELECT 
                p.category,
                SUM(f.total_sale) AS total_sales_amount
            FROM FactOrders f
            JOIN DimProduct p ON f.product_id = p.product_id
            WHERE f.seller_id = ?
            GROUP BY p.category
            ORDER BY total_sales_amount DESC
        `, [sellerId]);
        return rows;
    } catch (error) {
        console.error('Error fetching Sales by Category:', error);
        throw error;
    }
}

// Report 3: Hourly sales
async function getHourlySales(sellerId) {
    try {
        const [rows] = await olapPool.query(`
            SELECT 
                t.t_hour,
                AVG(f.total_sale) AS avg_sales
            FROM FactOrders f
            JOIN DimTime t ON f.time_id = t.time_id
            WHERE f.seller_id = ?
            GROUP BY t.t_hour
            ORDER BY t.t_hour
        `, [sellerId]);
        
        // Ensure all 24 hours are represented
        const hourlyData = Array(24).fill(0).map((_, hour) => ({
            t_hour: hour,
            avg_sales: 0
        }));
        
        rows.forEach(row => {
            hourlyData[row.t_hour] = row;
        });
        
        return hourlyData;
    } catch (error) {
        console.error('Error fetching hourly average sales:', error);
        throw error;
    }
}

// Export functions
module.exports = {
    getTop10SellingItems,
    getSalesByCategory,
    getHourlySales
};