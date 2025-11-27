const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function setupDatabase() {
  let connection;
  try {
    // Connect without database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('📦 Setting up database...');

    // Create database if not exists
    const dbName = process.env.DB_NAME || 'flashsale';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await connection.query(`USE ${dbName}`);

    // Read and execute schema
    const schemaPath = path.resolve(__dirname, '../../database/schema_oltp.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await connection.query(schema);

    console.log('✅ Database schema created successfully');
    
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    throw err;
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = setupDatabase;