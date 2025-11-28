const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'flashsale',
      multipleStatements: true,
    });

    const sql = fs.readFileSync(
      path.resolve(__dirname, '../../database/indexes.sql'),
      'utf8'
    );
    await conn.query(sql);
    console.log('Indexes applied successfully');
  } catch (e) {
    console.error('Failed to apply indexes:', e.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();