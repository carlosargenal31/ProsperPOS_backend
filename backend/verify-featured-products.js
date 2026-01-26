// ===================================================================
// PROSPERPOS - VERIFICAR PRODUCTOS DESTACADOS
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyFeaturedProducts() {
  let connection;

  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'venta_pos'
    });

    console.log('✓ Conectado a la base de datos\n');

    // Verificar columna is_featured
    console.log('1. Verificando columna is_featured:');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'is_featured'
    `, [process.env.DB_NAME || 'venta_pos']);

    if (columns.length > 0) {
      console.log('   ✓ Columna existe');
      console.log(`   - Tipo: ${columns[0].COLUMN_TYPE}`);
      console.log(`   - Default: ${columns[0].COLUMN_DEFAULT}`);
    } else {
      console.log('   ✗ Columna NO existe');
      return;
    }

    // Contar productos destacados
    console.log('\n2. Productos destacados:');
    const [summary] = await connection.query(`
      SELECT
        COUNT(*) as total_featured,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_featured,
        COUNT(CASE WHEN image IS NOT NULL AND image != '' THEN 1 END) as with_image
      FROM products
      WHERE is_featured = 1 AND deleted_at IS NULL
    `);

    console.log(`   - Total destacados: ${summary[0].total_featured}`);
    console.log(`   - Destacados activos: ${summary[0].active_featured}`);
    console.log(`   - Con imagen: ${summary[0].with_image}`);

    // Listar productos destacados
    if (summary[0].total_featured > 0) {
      console.log('\n3. Lista de productos destacados:');
      const [products] = await connection.query(`
        SELECT
          p.id,
          p.name,
          p.code,
          p.is_active,
          p.price_1,
          CASE WHEN p.image IS NOT NULL AND p.image != '' THEN 'Sí' ELSE 'No' END as tiene_imagen,
          COALESCE(c.name, 'Sin categoría') as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_featured = 1 AND p.deleted_at IS NULL
        ORDER BY p.updated_at DESC
      `);

      products.forEach((product, index) => {
        const status = product.is_active ? '✓' : '✗';
        console.log(`   ${index + 1}. [${status}] ${product.name}`);
        console.log(`      Código: ${product.code}`);
        console.log(`      Precio: $${product.price_1}`);
        console.log(`      Categoría: ${product.category_name}`);
        console.log(`      Imagen: ${product.tiene_imagen}`);
      });
    }

    // Verificar índice
    console.log('\n4. Verificando índice:');
    const [indexes] = await connection.query(`
      SHOW INDEX FROM products WHERE Key_name = 'idx_is_featured'
    `);

    if (indexes.length > 0) {
      console.log('   ✓ Índice idx_is_featured existe');
    } else {
      console.log('   ⚠ Índice idx_is_featured NO existe (opcional pero recomendado)');
    }

    // Simular query del endpoint
    console.log('\n5. Simulando query del endpoint /api/v1/ecommerce/products/featured:');
    const [featured] = await connection.query(`
      SELECT
        p.id,
        p.name,
        p.code,
        p.description,
        p.image,
        COALESCE(u.name, 'UND') as unit,
        COALESCE(c.name, '') as category_name,
        COALESCE(b.name, '') as brand_name,
        p.price_1 as sale_price,
        COALESCE(t.rate, 0) as tax_rate,
        0 as stock_available
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN tax_rates t ON p.tax_id = t.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.is_active = 1
        AND p.deleted_at IS NULL
        AND p.is_featured = 1
      ORDER BY p.updated_at DESC
      LIMIT 10
    `);

    console.log(`   ✓ Query ejecutada correctamente`);
    console.log(`   ✓ Productos retornados: ${featured.length}`);

    if (featured.length > 0) {
      console.log('\n   Primeros 3 productos que retornaría el endpoint:');
      featured.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} - $${p.sale_price}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

// Ejecutar
verifyFeaturedProducts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error fatal:', error);
    process.exit(1);
  });
