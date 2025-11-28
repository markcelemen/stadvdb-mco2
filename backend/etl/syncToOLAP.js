const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create separate connections for OLTP and OLAP
async function createConnections() {
    const oltpConnection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'flashsale'
    });

    const olapConnection = await mysql.createConnection({
        host: process.env.DB_OLAP_HOST || 'localhost',
        port: Number(process.env.DB_OLAP_PORT || 3308),
        user: process.env.DB_OLAP_USER || 'root',
        password: process.env.DB_OLAP_PASSWORD || '',
        database: process.env.DB_OLAP_NAME || 'flashsale_olap'
    });

    return { oltpConnection, olapConnection };
}

async function syncDimBuyer(oltp, olap) {
    console.log('🔄 Syncing DimBuyer...');
    
    // Clear existing data
    await olap.query('SET FOREIGN_KEY_CHECKS = 0');
    await olap.query('TRUNCATE TABLE DimBuyer');
    await olap.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Extract buyers from OLTP
    const [buyers] = await oltp.query(`
        SELECT user_id, user_name 
        FROM Users 
        WHERE user_role = 'BUYER'
    `);
    
    // Load into OLAP
    for (const buyer of buyers) {
        await olap.query(
            'INSERT INTO DimBuyer (buyer_id, user_name) VALUES (?, ?)',
            [buyer.user_id, buyer.user_name]
        );
    }
    
    console.log(`✅ Synced ${buyers.length} buyers`);
}

async function syncDimSeller(oltp, olap) {
    console.log('🔄 Syncing DimSeller...');
    
    await olap.query('SET FOREIGN_KEY_CHECKS = 0');
    await olap.query('TRUNCATE TABLE DimSeller');
    await olap.query('SET FOREIGN_KEY_CHECKS = 1');
    
    const [sellers] = await oltp.query(`
        SELECT user_id, user_name 
        FROM Users 
        WHERE user_role = 'SELLER'
    `);
    
    for (const seller of sellers) {
        await olap.query(
            'INSERT INTO DimSeller (seller_id, user_name) VALUES (?, ?)',
            [seller.user_id, seller.user_name]
        );
    }
    
    console.log(`✅ Synced ${sellers.length} sellers`);
}

async function syncDimProduct(oltp, olap) {
    console.log('🔄 Syncing DimProduct...');
    
    await olap.query('SET FOREIGN_KEY_CHECKS = 0');
    await olap.query('TRUNCATE TABLE DimProduct');
    await olap.query('SET FOREIGN_KEY_CHECKS = 1');
    
    const [products] = await oltp.query(`
        SELECT product_id, product_name, category, original_price 
        FROM Products
    `);
    
    for (const product of products) {
        await olap.query(
            'INSERT INTO DimProduct (product_id, product_name, category, original_price) VALUES (?, ?, ?, ?)',
            [product.product_id, product.product_name, product.category, product.original_price]
        );
    }
    
    console.log(`✅ Synced ${products.length} products`);
}

async function syncDimTime(oltp, olap) {
    console.log('🔄 Syncing DimTime...');
    
    await olap.query('SET FOREIGN_KEY_CHECKS = 0');
    await olap.query('TRUNCATE TABLE DimTime');
    await olap.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Extract unique timestamps from Orders and FlashSales
    const [orderTimes] = await oltp.query('SELECT DISTINCT created_at FROM Orders');
    const [flashSaleStart] = await oltp.query('SELECT DISTINCT start_time FROM FlashSales WHERE start_time IS NOT NULL');
    const [flashSaleEnd] = await oltp.query('SELECT DISTINCT end_time FROM FlashSales WHERE end_time IS NOT NULL');
    
    const timeSet = new Map();
    
    // Helper function to add time entries
    const addTime = (datetime) => {
        if (!datetime) return;
        const d = new Date(datetime);
        const timeId = parseInt(
            `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${String(d.getHours()).padStart(2,'0')}`
        );
        
        if (!timeSet.has(timeId)) {
            timeSet.set(timeId, {
                time_id: timeId,
                t_hour: d.getHours(),
                t_day: d.getDate(),
                t_month: d.getMonth() + 1,
                t_year: d.getFullYear()
            });
        }
    };
    
    // Process all timestamps
    orderTimes.forEach(row => addTime(row.created_at));
    flashSaleStart.forEach(row => addTime(row.start_time));
    flashSaleEnd.forEach(row => addTime(row.end_time));
    
    // Load into OLAP
    for (const [timeId, timeData] of timeSet) {
        await olap.query(
            'INSERT INTO DimTime (time_id, t_hour, t_day, t_month, t_year) VALUES (?, ?, ?, ?, ?)',
            [timeData.time_id, timeData.t_hour, timeData.t_day, timeData.t_month, timeData.t_year]
        );
    }
    
    console.log(`✅ Synced ${timeSet.size} time entries`);
}

async function syncDimFlashSale(oltp, olap) {
    console.log('🔄 Syncing DimFlashSale...');
    
    await olap.query('SET FOREIGN_KEY_CHECKS = 0');
    await olap.query('TRUNCATE TABLE DimFlashSale');
    await olap.query('SET FOREIGN_KEY_CHECKS = 1');
    
    const [flashSales] = await oltp.query('SELECT flash_sale_id, name, start_time, end_time FROM FlashSales');
    
    // Helper to generate time_id
    const getTimeId = (datetime) => {
        if (!datetime) return null;
        const d = new Date(datetime);
        return parseInt(
            `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${String(d.getHours()).padStart(2,'0')}`
        );
    };
    
    for (const fs of flashSales) {
        const startTimeId = getTimeId(fs.start_time);
        const endTimeId = getTimeId(fs.end_time);
        
        await olap.query(
            'INSERT INTO DimFlashSale (flash_sale_id, name, start_time_id, end_time_id) VALUES (?, ?, ?, ?)',
            [fs.flash_sale_id, fs.name, startTimeId, endTimeId]
        );
    }
    
    console.log(`✅ Synced ${flashSales.length} flash sales`);
}

async function syncFactOrders(oltp, olap) {
    console.log('🔄 Syncing FactOrders...');
    
    await olap.query('SET FOREIGN_KEY_CHECKS = 0');
    await olap.query('TRUNCATE TABLE FactOrders');
    await olap.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Extract order items with all necessary dimensions
    const [orderItems] = await oltp.query(`
        SELECT 
            oi.order_id,
            oi.product_id,
            oi.quantity_sold,
            p.price AS price_per_item,
            p.seller_id,
            p.flash_sale_id,
            o.buyer_id,
            o.created_at
        FROM OrderItems oi
        JOIN Products p ON oi.product_id = p.product_id
        JOIN Orders o ON oi.order_id = o.order_id
    `);
    
    // Get existing dimension IDs to validate references
    const [buyers] = await olap.query('SELECT buyer_id FROM DimBuyer');
    const [sellers] = await olap.query('SELECT seller_id FROM DimSeller');
    const [products] = await olap.query('SELECT product_id FROM DimProduct');
    const [flashSales] = await olap.query('SELECT flash_sale_id FROM DimFlashSale');
    
    const validBuyerIds = new Set(buyers.map(b => b.buyer_id));
    const validSellerIds = new Set(sellers.map(s => s.seller_id));
    const validProductIds = new Set(products.map(p => p.product_id));
    const validFlashSaleIds = new Set(flashSales.map(fs => fs.flash_sale_id));
    
    // Helper to generate time_id
    const getTimeId = (datetime) => {
        const d = new Date(datetime);
        return parseInt(
            `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${String(d.getHours()).padStart(2,'0')}`
        );
    };
    
    let skipped = 0;
    let inserted = 0;
    
    // Load into FactOrders
    for (const oi of orderItems) {
        // Skip if product doesn't exist in dimension (critical)
        if (!validProductIds.has(oi.product_id)) {
            console.warn(`⚠️  Skipping order ${oi.order_id}: Product ${oi.product_id} not in DimProduct`);
            skipped++;
            continue;
        }
        
        const timeId = getTimeId(oi.created_at);
        const totalSale = oi.quantity_sold * oi.price_per_item;
        
        // Set to NULL if reference doesn't exist
        const buyerId = validBuyerIds.has(oi.buyer_id) ? oi.buyer_id : null;
        const sellerId = validSellerIds.has(oi.seller_id) ? oi.seller_id : null;
        const flashSaleId = oi.flash_sale_id && validFlashSaleIds.has(oi.flash_sale_id) ? oi.flash_sale_id : null;
        
        if (buyerId === null) {
            console.warn(`⚠️  Order ${oi.order_id}: Buyer ${oi.buyer_id} not found, setting to NULL`);
        }
        if (sellerId === null) {
            console.warn(`⚠️  Order ${oi.order_id}: Seller ${oi.seller_id} not found, setting to NULL`);
        }
        
        await olap.query(`
            INSERT INTO FactOrders 
            (order_id, product_id, time_id, buyer_id, seller_id, flash_sale_id, quantity_sold, price_per_item, total_sale)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            oi.order_id,
            oi.product_id,
            timeId,
            buyerId,
            sellerId,
            flashSaleId,
            oi.quantity_sold,
            oi.price_per_item,
            totalSale
        ]);
        
        inserted++;
    }
    
    console.log(`✅ Synced ${inserted} order facts (${skipped} skipped due to missing products)`);
}

async function runETL() {
    let oltpConnection, olapConnection;
    
    try {
        console.log('🚀 Starting ETL Process: OLTP → OLAP');
        console.log('📊 Source: flashsale (port 3306)');
        console.log('📊 Target: flashsale_olap (port 3308)\n');
        
        // Create connections
        const connections = await createConnections();
        oltpConnection = connections.oltpConnection;
        olapConnection = connections.olapConnection;
        
        console.log('✅ Database connections established\n');
        
        // Execute ETL in proper order (dimensions first, then facts)
        await syncDimBuyer(oltpConnection, olapConnection);
        await syncDimSeller(oltpConnection, olapConnection);
        await syncDimProduct(oltpConnection, olapConnection);
        await syncDimTime(oltpConnection, olapConnection);
        await syncDimFlashSale(oltpConnection, olapConnection);
        await syncFactOrders(oltpConnection, olapConnection);
        
        console.log('\n🎉 ETL Process Completed Successfully!');
        console.log('✅ All data synced from OLTP to OLAP');
        
    } catch (error) {
        console.error('\n❌ ETL Process Failed:', error.message);
        console.error(error);
        throw error;
    } finally {
        if (oltpConnection) await oltpConnection.end();
        if (olapConnection) await olapConnection.end();
        console.log('\n🔌 Database connections closed');
    }
}

// Run ETL if executed directly
if (require.main === module) {
    runETL()
        .then(() => {
            console.log('\n✅ ETL script finished successfully');
            process.exit(0);
        })
        .catch((err) => {
            console.error('\n❌ ETL script failed:', err);
            process.exit(1);
        });
}

module.exports = runETL;