// ===================================================================
// PROSPERPOS - SCRIPT PARA ARREGLAR SUBCATEGORÍAS
// ===================================================================
// Este script actualiza las subcategorías sin category_id asignado
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSubcategories() {
  let connection;

  try {
    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado a la base de datos');

    // Ver estado actual
    console.log('\n=== ESTADO ACTUAL ===');
    const [currentState] = await connection.execute(`
      SELECT
        s.id,
        s.name as subcategoria,
        s.category_id,
        c.name as categoria
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.deleted_at IS NULL
    `);
    console.table(currentState);

    // Obtener primera categoría disponible
    const [categories] = await connection.execute(`
      SELECT MIN(id) as first_id
      FROM categories
      WHERE deleted_at IS NULL
    `);

    if (categories.length === 0 || !categories[0].first_id) {
      console.log('❌ No hay categorías disponibles en el sistema');
      return;
    }

    const firstCategoryId = categories[0].first_id;
    console.log(`\n📌 Primera categoría disponible: ID ${firstCategoryId}`);

    // Actualizar subcategorías sin category_id
    const [updateResult] = await connection.execute(`
      UPDATE subcategories
      SET category_id = ?
      WHERE (category_id IS NULL OR category_id = 0)
        AND deleted_at IS NULL
    `, [firstCategoryId]);

    console.log(`\n✅ ${updateResult.affectedRows} subcategoría(s) actualizada(s)`);

    // Ver estado después del fix
    console.log('\n=== DESPUÉS DEL FIX ===');
    const [fixedState] = await connection.execute(`
      SELECT
        s.id,
        s.name as subcategoria,
        s.category_id,
        c.name as categoria
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.deleted_at IS NULL
    `);
    console.table(fixedState);

    console.log('\n✅ Subcategorías actualizadas exitosamente');

  } catch (error) {
    console.error('❌ Error al actualizar subcategorías:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexión cerrada');
    }
  }
}

// Ejecutar el script
fixSubcategories()
  .then(() => {
    console.log('\n🎉 Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
