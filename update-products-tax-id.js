/**
 * Script to update all products to have tax_id = 1
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateProductsTaxId() {
  let connection;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('Conectado a la base de datos');

    // Update products with NULL or 0 tax_id to 1
    const [result] = await connection.execute(
      'UPDATE products SET tax_id = 1 WHERE tax_id IS NULL OR tax_id = 0'
    );

    console.log(`Productos actualizados: ${result.affectedRows}`);

    // Verify the update
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as total FROM products WHERE tax_id = 1'
    );

    console.log(`Total de productos con tax_id = 1: ${rows[0].total}`);

  } catch (error) {
    console.error('Error actualizando productos:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

updateProductsTaxId();
