const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function setupDatabases() {
let connection;
try {
connection = await mysql.createConnection({
host: process.env.DB_HOST || 'localhost',
port: Number(process.env.DB_PORT || 3306),
user: process.env.DB_USER || 'root',
password: process.env.DB_PASSWORD || '',
multipleStatements: true
});

console.log('📦 Setting up databases...');

// -----------------------------
// Setup OLTP database
// -----------------------------
const oltpDb = process.env.DB_NAME || 'flashsale';
await connection.query(`CREATE DATABASE IF NOT EXISTS ${oltpDb}`);
await connection.query(`USE ${oltpDb}`);

const schemaPath = path.resolve(__dirname, '../../database/schema_oltp.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
await connection.query(schema);

console.log(`✅ OLTP database "${oltpDb}" created successfully`);

// -----------------------------
// Setup OLAP database
// -----------------------------
const olapDb = process.env.DB_OLAP_NAME || 'flashsale_olap';
await connection.query(`CREATE DATABASE IF NOT EXISTS ${olapDb}`);
await connection.query(`USE ${olapDb}`);

const olapSchema = `
  CREATE TABLE IF NOT EXISTS DimBuyer(
    buyer_id INT PRIMARY KEY,
    user_name VARCHAR(100)
  );

  CREATE TABLE IF NOT EXISTS DimSeller(
    seller_id INT PRIMARY KEY,
    user_name VARCHAR(100)
  );

  CREATE TABLE IF NOT EXISTS DimProduct(
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100),
    category VARCHAR(100),
    original_price DECIMAL(8,2)
  );

  CREATE TABLE IF NOT EXISTS DimTime(
    time_id INT PRIMARY KEY,
    t_hour INT,
    t_day INT,
    t_month INT,
    t_year INT
  );

  CREATE TABLE IF NOT EXISTS DimFlashSale(
    flash_sale_id INT PRIMARY KEY,
    name VARCHAR(100),
    start_time_id INT,
    end_time_id INT,
    FOREIGN KEY (start_time_id) REFERENCES DimTime(time_id),
    FOREIGN KEY (end_time_id) REFERENCES DimTime(time_id)
  );

  CREATE TABLE IF NOT EXISTS FactOrders(
    order_id INT PRIMARY KEY,
    product_id INT,
    time_id INT,
    buyer_id INT,
    seller_id INT,
    flash_sale_id INT,
    quantity_sold INT,
    price_per_item DECIMAL(8,2),
    total_sale DECIMAL(11,2),
    FOREIGN KEY (product_id) REFERENCES DimProduct(product_id),
    FOREIGN KEY (time_id) REFERENCES DimTime(time_id),
    FOREIGN KEY (buyer_id) REFERENCES DimBuyer(buyer_id),
    FOREIGN KEY (seller_id) REFERENCES DimSeller(seller_id),
    FOREIGN KEY (flash_sale_id) REFERENCES DimFlashSale(flash_sale_id)
  );
`;
await connection.query(olapSchema);

console.log(`✅ OLAP database "${olapDb}" created successfully`);


} catch (err) {
console.error('❌ Database setup failed:', err.message);
throw err;
} finally {
if (connection) await connection.end();
}
}

module.exports = setupDatabases;
