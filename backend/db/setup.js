const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function setupDatabases() {
  let oltpConn, backupConn, olapConn;
  
  try {
    console.log('📦 Setting up databases on 3 servers...\n');

    // ========================================
    // OLTP - Main Database (Port 3306)
    // ========================================
    oltpConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    const oltpDb = process.env.DB_NAME || 'flashsale';
    await oltpConn.query(`CREATE DATABASE IF NOT EXISTS ${oltpDb}`);
    await oltpConn.query(`USE ${oltpDb}`);

    const schemaPath = path.resolve(__dirname, '../../database/schema_oltp.sql');
    const oltpSchema = fs.readFileSync(schemaPath, 'utf8');
    await oltpConn.query(oltpSchema);

    console.log(`✅ OLTP Database setup complete`);
    console.log(`   Server: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   Database: ${oltpDb}\n`);

    // ========================================
    // Hot Backup Database (Port 3307)
    // ========================================
    backupConn = await mysql.createConnection({
      host: process.env.DB_BACKUP_HOST || 'localhost',
      port: Number(process.env.DB_BACKUP_PORT || 3307),
      user: process.env.DB_BACKUP_USER || 'root',
      password: process.env.DB_BACKUP_PASSWORD || '',
      multipleStatements: true
    });

    const backupDb = process.env.DB_BACKUP_NAME || 'flashsale';
    await backupConn.query(`CREATE DATABASE IF NOT EXISTS ${backupDb}`);
    await backupConn.query(`USE ${backupDb}`);
    await backupConn.query(oltpSchema); // Same schema as main

    console.log(`✅ Hot Backup Database setup complete`);
    console.log(`   Server: ${process.env.DB_BACKUP_HOST}:${process.env.DB_BACKUP_PORT}`);
    console.log(`   Database: ${backupDb}\n`);

    // ========================================
    // OLAP - Analytics Database (Port 3308)
    // ========================================
    olapConn = await mysql.createConnection({
      host: process.env.DB_OLAP_HOST || 'localhost',
      port: Number(process.env.DB_OLAP_PORT || 3308),
      user: process.env.DB_OLAP_USER || 'root',
      password: process.env.DB_OLAP_PASSWORD || '',
      multipleStatements: true
    });

    const olapDb = process.env.DB_OLAP_NAME || 'flashsale_olap';
    await olapConn.query(`CREATE DATABASE IF NOT EXISTS ${olapDb}`);
    await olapConn.query(`USE ${olapDb}`);

    // Read OLAP schema from file
    const olapSchemaPath = path.resolve(__dirname, '../../database/schema_olap.sql');
    const olapSchema = fs.readFileSync(olapSchemaPath, 'utf8');
    await olapConn.query(olapSchema);

    console.log(`✅ OLAP Database setup complete`);
    console.log(`   Server: ${process.env.DB_OLAP_HOST}:${process.env.DB_OLAP_PORT}`);
    console.log(`   Database: ${olapDb}\n`);

    console.log('🎉 All databases configured successfully!');

  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    throw err;
  } finally {
    if (oltpConn) await oltpConn.end();
    if (backupConn) await backupConn.end();
    if (olapConn) await olapConn.end();
  }
}

module.exports = setupDatabases;
