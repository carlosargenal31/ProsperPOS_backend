// ===================================================================
// PROSPERPOS - TEST CATEGORÍAS VISIBLES
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testVisibleCategories() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'venta_pos'
    });

    console.log('✓ Conectado a la base de datos\n');

    console.log('='.repeat(70));
    console.log('TEST: CATEGORÍAS VISIBLES EN E-COMMERCE');
    console.log('='.repeat(70) + '\n');

    // Test 1: Todas las categorías
    console.log('1. Todas las categorías activas:');
    const [allCategories] = await connection.query(`
      SELECT
        c.id,
        c.name,
        c.is_active,
        c.show_in_ecommerce,
        c.image_url,
        COUNT(DISTINCT p.id) as products_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL AND p.is_active = 1
      WHERE c.is_active = 1 AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    console.log(`   Total: ${allCategories.length} categorías\n`);

    // Test 2: Categorías visibles en e-commerce
    console.log('2. Categorías visibles en e-commerce (show_in_ecommerce = 1):');
    const [visibleCategories] = await connection.query(`
      SELECT
        c.id,
        c.name,
        c.image_url,
        c.show_in_ecommerce,
        COUNT(DISTINCT p.id) as products_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL AND p.is_active = 1
      WHERE c.is_active = 1 AND c.deleted_at IS NULL AND c.show_in_ecommerce = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    console.log(`   Total: ${visibleCategories.length} categorías visibles\n`);

    if (visibleCategories.length > 0) {
      visibleCategories.forEach((cat, i) => {
        console.log(`   ${i + 1}. ${cat.name}`);
        console.log(`      - ID: ${cat.id}`);
        console.log(`      - Productos: ${cat.products_count}`);
        console.log(`      - Imagen: ${cat.image_url ? '✓ Sí' : '✗ No'}`);
        console.log(`      - URL: ${cat.image_url || 'N/A'}`);
      });
    } else {
      console.log('   ⚠ No hay categorías visibles configuradas');
      console.log('   Ejecuta: node set-visible-categories.js\n');
    }

    console.log('\n' + '='.repeat(70));
    console.log('SIMULACIÓN DEL ENDPOINT');
    console.log('='.repeat(70) + '\n');

    console.log('GET /api/v1/ecommerce/categories?visible_only=true\n');

    const apiResponse = {
      success: true,
      data: visibleCategories
    };

    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('✓ TEST COMPLETADO');
    console.log('='.repeat(70) + '\n');

    await connection.end();

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

testVisibleCategories();
