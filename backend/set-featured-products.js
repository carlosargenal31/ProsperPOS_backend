// ===================================================================
// PROSPERPOS - MARCAR PRODUCTOS COMO DESTACADOS
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setFeaturedProducts() {
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

    // Primero, desmarcar todos los productos destacados actuales
    await connection.query(`
      UPDATE products
      SET is_featured = 0
      WHERE is_featured = 1
    `);

    console.log('✓ Productos destacados anteriores desmarcados');

    // Obtener 10 productos aleatorios activos para marcar como destacados
    // Priorizamos productos con imágenes y que estén en la tienda online
    const [products] = await connection.query(`
      SELECT id, name, code
      FROM products
      WHERE is_active = 1
        AND deleted_at IS NULL
        AND image IS NOT NULL
        AND image != ''
      ORDER BY RAND()
      LIMIT 10
    `);

    if (products.length === 0) {
      console.log('⚠ No se encontraron productos disponibles');
      return;
    }

    console.log(`\n✓ Encontrados ${products.length} productos para destacar:`);

    // Marcar productos como destacados
    for (const product of products) {
      await connection.query(`
        UPDATE products
        SET is_featured = 1, updated_at = NOW()
        WHERE id = ?
      `, [product.id]);

      console.log(`  - ${product.name} (${product.code})`);
    }

    console.log(`\n✓ ${products.length} productos marcados como destacados`);

    // Mostrar resumen
    const [summary] = await connection.query(`
      SELECT
        COUNT(*) as total_featured,
        COUNT(CASE WHEN show_in_online_store = 1 THEN 1 END) as in_online_store,
        COUNT(CASE WHEN image IS NOT NULL AND image != '' THEN 1 END) as with_image
      FROM products
      WHERE is_featured = 1 AND deleted_at IS NULL
    `);

    console.log('\nResumen:');
    console.log(`  - Total destacados: ${summary[0].total_featured}`);
    console.log(`  - En tienda online: ${summary[0].in_online_store}`);
    console.log(`  - Con imagen: ${summary[0].with_image}`);

  } catch (error) {
    console.error('✗ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

// Ejecutar
setFeaturedProducts()
  .then(() => {
    console.log('\n✓ Productos destacados configurados exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error:', error);
    process.exit(1);
  });
