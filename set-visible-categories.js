// ===================================================================
// PROSPERPOS - MARCAR CATEGORÍAS VISIBLES EN E-COMMERCE
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setVisibleCategories() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'venta_pos'
    });

    console.log('✓ Conectado a la base de datos\n');

    // Primero desmarcar todas las categorías visibles
    console.log('1. Desmarcando todas las categorías visibles...');
    await connection.query(`
      UPDATE categories
      SET show_in_ecommerce = 0, updated_at = NOW()
      WHERE deleted_at IS NULL
    `);
    console.log('   ✓ Todas las categorías desmarcadas\n');

    // Seleccionar hasta 4 categorías activas con imágenes
    console.log('2. Seleccionando hasta 4 categorías con imágenes...');
    const [categories] = await connection.query(`
      SELECT id, name, image_url
      FROM categories
      WHERE is_active = 1
        AND deleted_at IS NULL
        AND image_url IS NOT NULL
        AND image_url != ''
      ORDER BY RAND()
      LIMIT 4
    `);

    if (categories.length === 0) {
      console.log('   ⚠ No se encontraron categorías con imágenes');
      console.log('   Seleccionando 4 categorías activas sin imagen...');

      const [categoriesNoImage] = await connection.query(`
        SELECT id, name, image_url
        FROM categories
        WHERE is_active = 1
          AND deleted_at IS NULL
        ORDER BY id ASC
        LIMIT 4
      `);

      if (categoriesNoImage.length === 0) {
        console.log('   ✗ No hay categorías activas disponibles\n');
        await connection.end();
        return;
      }

      // Marcar estas categorías como visibles
      const ids = categoriesNoImage.map(c => c.id);
      await connection.query(`
        UPDATE categories
        SET show_in_ecommerce = 1, updated_at = NOW()
        WHERE id IN (?)
      `, [ids]);

      console.log(`   ✓ ${categoriesNoImage.length} categorías marcadas como visibles:\n`);
      categoriesNoImage.forEach((cat, i) => {
        console.log(`   ${i + 1}. ${cat.name}`);
        console.log(`      - ID: ${cat.id}`);
        console.log(`      - Imagen: ${cat.image_url ? 'Sí' : 'No'}`);
      });

    } else {
      // Marcar estas categorías como visibles
      const ids = categories.map(c => c.id);
      await connection.query(`
        UPDATE categories
        SET show_in_ecommerce = 1, updated_at = NOW()
        WHERE id IN (?)
      `, [ids]);

      console.log(`   ✓ ${categories.length} categorías marcadas como visibles:\n`);
      categories.forEach((cat, i) => {
        console.log(`   ${i + 1}. ${cat.name}`);
        console.log(`      - ID: ${cat.id}`);
        console.log(`      - Imagen: ✓ Sí`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ CATEGORÍAS VISIBLES CONFIGURADAS');
    console.log('='.repeat(60));
    console.log('\nAhora puedes ver estas categorías en:');
    console.log('- Panel de administración > Tienda Online > Categorías Visibles');
    console.log('- Endpoint público: GET /api/v1/ecommerce/categories\n');

    await connection.end();

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

setVisibleCategories();
