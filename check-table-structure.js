const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructure() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('Conectado a la base de datos');

    const [columns] = await connection.query(`
      DESCRIBE cargo_descargo
    `);

    console.log('\nEstructura de la tabla cargo_descargo:');
    console.log('=====================================');
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null} ${col.Key} ${col.Default || ''}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
  process.exit(0);
}

checkTableStructure();
