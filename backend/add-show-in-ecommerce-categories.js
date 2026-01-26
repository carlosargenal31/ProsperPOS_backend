// ===================================================================
// PROSPERPOS - AGREGAR COLUMNA show_in_ecommerce A CATEGORÍAS
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addShowInEcommerceColumn() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'venta_pos'
    });

    console.log('✓ Conectado a la base de datos\n');

    // Verificar si la columna ya existe
    console.log('1. Verificando si la columna show_in_ecommerce existe...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'categories'
        AND COLUMN_NAME = 'show_in_ecommerce'
    `, [process.env.DB_NAME || 'venta_pos']);

    if (columns.length > 0) {
      console.log('   ⚠ La columna show_in_ecommerce ya existe\n');
      await connection.end();
      return;
    }

    // Agregar la columna
    console.log('2. Agregando columna show_in_ecommerce...');
    await connection.query(`
      ALTER TABLE categories
      ADD COLUMN show_in_ecommerce TINYINT(1) DEFAULT 0
      AFTER is_active
    `);
    console.log('   ✓ Columna agregada exitosamente\n');

    // Crear índice para optimizar consultas
    console.log('3. Creando índice idx_show_in_ecommerce...');
    await connection.query(`
      CREATE INDEX idx_show_in_ecommerce ON categories(show_in_ecommerce)
    `);
    console.log('   ✓ Índice creado exitosamente\n');

    console.log('='.repeat(60));
    console.log('✓ IMPLEMENTACIÓN COMPLETADA');
    console.log('='.repeat(60));
    console.log('\nAhora puedes:');
    console.log('- Marcar categorías para mostrar en e-commerce');
    console.log('- Usar el endpoint GET /api/v1/ecommerce/categories');
    console.log('- Gestionar desde el panel de administración\n');

    await connection.end();

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

addShowInEcommerceColumn();
