// ===================================================================
// SCRIPT PARA AGREGAR COLUMNA show_in_ecommerce A TABLA categories
// ===================================================================

const db = require('./src/utils/database');

async function addShowInEcommerceColumn() {
  try {
    console.log('🔍 Verificando columna show_in_ecommerce...');

    // Verificar si la columna ya existe
    const columns = await db.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'categories'
        AND COLUMN_NAME = 'show_in_ecommerce'
    `);

    if (columns.length > 0) {
      console.log('✅ La columna show_in_ecommerce ya existe');
      process.exit(0);
    }

    console.log('➕ Agregando columna show_in_ecommerce...');

    // Agregar la columna
    await db.execute(`
      ALTER TABLE categories
      ADD COLUMN show_in_ecommerce TINYINT(1) DEFAULT 0
      AFTER is_active
    `);

    console.log('✅ Columna show_in_ecommerce agregada exitosamente');

    // Verificar cuántas categorías hay
    const categories = await db.execute(`
      SELECT id, name FROM categories WHERE deleted_at IS NULL
    `);

    console.log(`\n📊 Categorías disponibles: ${categories.length}`);

    if (categories.length > 0) {
      console.log('\n💡 Puedes marcar categorías para mostrar en ecommerce desde la interfaz de administración');
      console.log('   o ejecutar:');
      console.log('   UPDATE categories SET show_in_ecommerce = 1 WHERE id IN (1,2,3,4);');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addShowInEcommerceColumn();
