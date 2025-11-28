const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create a pool for OLTP
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flashsale',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create a pool for OLAP
const olapPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_OLAP_NAME || 'flashsale_olap',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connections
async function testPools() {
  try {
    const conn1 = await pool.getConnection();
    console.log(`✅ OLTP pool connected to "${process.env.DB_NAME || 'flashsale'}"`);
    conn1.release();

    const conn2 = await olapPool.getConnection();
    console.log(`✅ OLAP pool connected to "${process.env.DB_OLAP_NAME || 'flashsale_olap'}"`);
    conn2.release();
  } catch (err) {
    console.error('❌ Pool connection error:', err.message);
  }
}
testPools();

module.exports = { pool, olapPool };