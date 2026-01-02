const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'venta_pos'
  });

  const [columns] = await connection.query(`
    SELECT COLUMN_NAME, COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'products'
    ORDER BY ORDINAL_POSITION
  `, [process.env.DB_NAME || 'venta_pos']);

  console.log('Columnas de la tabla products:\n');
  columns.forEach(col => {
    console.log(`  ${col.COLUMN_NAME} (${col.COLUMN_TYPE})`);
  });

  await connection.end();
}

checkColumns();
