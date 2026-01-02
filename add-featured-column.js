// ===================================================================
// PROSPERPOS - AGREGAR COLUMNA is_featured A PRODUCTS
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addFeaturedColumn() {
  let connection;

  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'venta_pos'
    });

    console.log('✓ Conectado a la base de datos');

    // Verificar si la columna ya existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'is_featured'
    `, [process.env.DB_NAME || 'venta_pos']);

    if (columns.length > 0) {
      console.log('⚠ La columna is_featured ya existe');
      return;
    }

    // Agregar columna is_featured
    await connection.query(`
      ALTER TABLE products
      ADD COLUMN is_featured TINYINT(1) DEFAULT 0
      AFTER show_in_online_store
    `);

    console.log('✓ Columna is_featured agregada exitosamente');

    // Crear índice para mejorar consultas
    await connection.query(`
      CREATE INDEX idx_is_featured ON products(is_featured)
    `);

    console.log('✓ Índice creado para is_featured');

  } catch (error) {
    console.error('✗ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Conexión cerrada');
    }
  }
}

// Ejecutar
addFeaturedColumn()
  .then(() => {
    console.log('\n✓ Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error en migración:', error);
    process.exit(1);
  });
