/**
 * Script para actualizar visibilidad de productos en tienda online
 * Activa todos los productos excepto el ID 144
 */

require('dotenv').config();
const db = require('./src/utils/database');

async function updateProducts() {
  try {
    console.log('🚀 Actualizando visibilidad de productos en tienda online...\n');

    // Actualizar todos los productos a show_in_online_store = 1
    console.log('1. Activando todos los productos en tienda online...');
    const result1 = await db.execute(
      'UPDATE products SET show_in_online_store = 1 WHERE deleted_at IS NULL'
    );
    console.log(`   ✅ ${result1.affectedRows} productos actualizados\n`);

    // Desactivar el producto con ID 144
    console.log('2. Desactivando producto ID 144...');
    const result2 = await db.execute(
      'UPDATE products SET show_in_online_store = 0 WHERE id = 144'
    );
    console.log(`   ✅ Producto 144 desactivado (${result2.affectedRows} fila afectada)\n`);

    // Verificar algunos productos
    console.log('3. Verificación de productos:');
    const check = await db.execute(`
      SELECT id, name, show_in_online_store,
             COALESCE((SELECT SUM(quantity) FROM stock WHERE product_id = products.id), 0) as stock_available
      FROM products
      WHERE id = 144 OR id IN (
        SELECT id FROM products
        WHERE deleted_at IS NULL
        ORDER BY id LIMIT 5
      )
      ORDER BY id
    `);

    console.log('   📦 Muestra de productos:');
    check.forEach(p => {
      const name = p.name.length > 35 ? p.name.substring(0, 35) + '...' : p.name;
      const visible = p.show_in_online_store === 1 ? '✅ SÍ' : '❌ NO';
      console.log(`      ID ${p.id.toString().padStart(4, ' ')} | ${name.padEnd(40, ' ')} | Visible: ${visible} | Stock: ${p.stock_available}`);
    });

    // Contar productos activos en tienda
    console.log('\n4. Resumen:');
    const count = await db.execute(
      'SELECT COUNT(*) as total FROM products WHERE show_in_online_store = 1 AND deleted_at IS NULL'
    );
    console.log(`   📊 Total productos visibles en tienda online: ${count[0].total}`);

    const countHidden = await db.execute(
      'SELECT COUNT(*) as total FROM products WHERE show_in_online_store = 0 AND deleted_at IS NULL'
    );
    console.log(`   🚫 Total productos ocultos: ${countHidden[0].total}`);

    console.log('\n✅ Actualización completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

updateProducts();
