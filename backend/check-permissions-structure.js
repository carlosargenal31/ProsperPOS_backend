const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    const [columns] = await connection.query('DESCRIBE permissions');
    console.table(columns);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStructure();
