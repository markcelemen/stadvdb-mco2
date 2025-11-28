const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper function to ensure database exists
async function ensureDatabase(config, dbName) {
  const connWithoutDb = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password
  });
  
  await connWithoutDb.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
  await connWithoutDb.end();
}

// Initialize databases before creating pools
async function initializeDatabases() {
  try {
    // Ensure OLTP database exists
    await ensureDatabase({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    }, process.env.DB_NAME || 'flashsale');

    // Ensure Backup database exists
    await ensureDatabase({
      host: process.env.DB_BACKUP_HOST || 'localhost',
      port: Number(process.env.DB_BACKUP_PORT || 3307),
      user: process.env.DB_BACKUP_USER || 'root',
      password: process.env.DB_BACKUP_PASSWORD || ''
    }, process.env.DB_BACKUP_NAME || 'flashsale');

    // Ensure OLAP database exists
    await ensureDatabase({
      host: process.env.DB_OLAP_HOST || 'localhost',
      port: Number(process.env.DB_OLAP_PORT || 3308),
      user: process.env.DB_OLAP_USER || 'root',
      password: process.env.DB_OLAP_PASSWORD || ''
    }, process.env.DB_OLAP_NAME || 'flashsale_olap');

    console.log('✅ All databases ensured to exist');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
}

// Run initialization
initializeDatabases();

// OLTP Pool - Main Database (Port 3306)
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

// Hot Backup Pool (Port 3307)
const backupPool = mysql.createPool({
  host: process.env.DB_BACKUP_HOST || 'localhost',
  port: Number(process.env.DB_BACKUP_PORT || 3307),
  user: process.env.DB_BACKUP_USER || 'root',
  password: process.env.DB_BACKUP_PASSWORD || '',
  database: process.env.DB_BACKUP_NAME || 'flashsale',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

// OLAP Pool - Analytics Database (Port 3308)
const olapPool = mysql.createPool({
  host: process.env.DB_OLAP_HOST || 'localhost',
  port: Number(process.env.DB_OLAP_PORT || 3308),
  user: process.env.DB_OLAP_USER || 'root',
  password: process.env.DB_OLAP_PASSWORD || '',
  database: process.env.DB_OLAP_NAME || 'flashsale_olap',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test all connections (runs after initialization)
async function testPools() {
  try {
    // Wait a bit for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test OLTP (3306)
    const conn1 = await pool.getConnection();
    console.log(`✅ OLTP (Main) connected: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    conn1.release();

    // Test Backup (3307)
    const conn2 = await backupPool.getConnection();
    console.log(`✅ Hot Backup connected: ${process.env.DB_BACKUP_HOST}:${process.env.DB_BACKUP_PORT}/${process.env.DB_BACKUP_NAME}`);
    conn2.release();

    // Test OLAP (3308)
    const conn3 = await olapPool.getConnection();
    console.log(`✅ OLAP (Analytics) connected: ${process.env.DB_OLAP_HOST}:${process.env.DB_OLAP_PORT}/${process.env.DB_OLAP_NAME}`);
    conn3.release();
  } catch (err) {
    console.error('❌ Pool connection error:', err.message);
  }
}
testPools();

module.exports = { pool, backupPool, olapPool };