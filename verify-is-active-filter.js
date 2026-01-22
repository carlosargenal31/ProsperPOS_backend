require('dotenv').config();
const db = require('./src/utils/database');

(async () => {
  try {
    console.log('Verificando filtros de productos en e-commerce...\n');

    // Total de productos que aparecerán en e-commerce
    const active = await db.execute(`
      SELECT COUNT(*) as total
      FROM products
      WHERE deleted_at IS NULL
        AND is_active = 1
        AND show_in_online_store = 1
    `);
    console.log('✓ Productos que SÍ aparecerán en e-commerce:');
    console.log('  (is_active = 1 AND show_in_online_store = 1)');
    console.log(`  Total: ${active[0].total}\n`);

    // Productos inactivos (is_active = 0)
    const inactive = await db.execute(`
      SELECT COUNT(*) as total
      FROM products
      WHERE deleted_at IS NULL
        AND is_active = 0
    `);
    console.log('✗ Productos con is_active = 0 (ocultos):');
    console.log(`  Total: ${inactive[0].total}\n`);

    // Productos con show_in_online_store = 0
    const notInStore = await db.execute(`
      SELECT COUNT(*) as total
      FROM products
      WHERE deleted_at IS NULL
        AND show_in_online_store = 0
    `);
    console.log('✗ Productos con show_in_online_store = 0 (ocultos):');
    console.log(`  Total: ${notInStore[0].total}\n`);

    // Productos que están activos pero no se muestran en tienda
    const activeButHidden = await db.execute(`
      SELECT COUNT(*) as total
      FROM products
      WHERE deleted_at IS NULL
        AND is_active = 1
        AND show_in_online_store = 0
    `);
    console.log('⚠ Productos activos pero ocultos de la tienda:');
    console.log('  (is_active = 1 pero show_in_online_store = 0)');
    console.log(`  Total: ${activeButHidden[0].total}\n`);

    console.log('Verificación completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
