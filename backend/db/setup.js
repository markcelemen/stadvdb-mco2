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

    // Configure MySQL settings for deadlock handling
    console.log('⚙️  Configuring MySQL runtime settings...');
    
    try {
      await connection.query('SET GLOBAL innodb_lock_wait_timeout = 5');
      console.log('   ✓ innodb_lock_wait_timeout set to 5 seconds');
    } catch (err) {
      console.warn('   ⚠️  Could not set innodb_lock_wait_timeout (may need SUPER privilege)');
    }

    try {
      await connection.query('SET GLOBAL innodb_print_all_deadlocks = ON');
      console.log('   ✓ innodb_print_all_deadlocks enabled');
    } catch (err) {
      console.warn('   ⚠️  Could not enable innodb_print_all_deadlocks (may need SUPER privilege)');
    }

    // Verify innodb_autoinc_lock_mode setting
    const [[{ Value: autoincMode }]] = await connection.query(
      "SHOW VARIABLES LIKE 'innodb_autoinc_lock_mode'"
    );
    console.log(`   ℹ️  innodb_autoinc_lock_mode = ${autoincMode} (${autoincMode === '2' ? 'optimal' : 'consider setting to 2 in my.cnf'})`);

    console.log('✅ MySQL configuration complete');
    
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    throw err;
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = setupDatabase;