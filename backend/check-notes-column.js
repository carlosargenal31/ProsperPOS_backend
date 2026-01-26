const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    const [rows] = await connection.query('DESCRIBE purchases_documents');
    console.log('Columnas de purchases_documents:');
    rows.forEach(row => {
      console.log(`- ${row.Field} (${row.Type})`);
    });

    const hasNotes = rows.some(row => row.Field === 'notes');
    console.log('\n¿Tiene columna notes?', hasNotes ? 'SÍ' : 'NO');

    if (!hasNotes) {
      console.log('\n⚠️ La columna notes NO existe. Necesita ser agregada.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkColumn();
