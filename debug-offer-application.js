const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '310104',
  database: 'prosperpos'
};

(async () => {
  try {
    const conn = await mysql.createConnection(config);

    // Get a product from subcategory 22
    const [products] = await conn.execute(
      'SELECT id, code, name, category_id, subcategory_id FROM products WHERE subcategory_id = 22 AND is_active = 1 LIMIT 1'
    );

    if (products.length === 0) {
      console.log('❌ No products found in subcategory 22');
      await conn.end();
      return;
    }

    const product = products[0];
    console.log('\n📦 Producto de prueba:');
    console.log('  ID:', product.id);
    console.log('  Código:', product.code);
    console.log('  Nombre:', product.name);
    console.log('  Category ID:', product.category_id);
    console.log('  Subcategory ID:', product.subcategory_id);

    // Get active offers
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, etc.
    const dayColumns = ['aplica_domingo', 'aplica_lunes', 'aplica_martes', 'aplica_miercoles', 'aplica_jueves', 'aplica_viernes', 'aplica_sabado'];
    const todayColumn = dayColumns[dayOfWeek];

    console.log('\n📅 Día de hoy:', todayColumn);

    const [offers] = await conn.execute(`
      SELECT
        o.*
      FROM offers o
      WHERE o.is_active = 1
        AND o.suspendida = 0
        AND o.${todayColumn} = 1
        AND (
          o.limitar_fecha = 0
          OR (o.fecha_desde <= CURDATE() AND o.fecha_hasta >= CURDATE())
        )
    `);

    console.log('\n✅ Ofertas activas encontradas:', offers.length);

    offers.forEach(offer => {
      console.log(`\n  Oferta: ${offer.codigo} - ${offer.nombre}`);
      console.log(`    - Tipo aplicación: ${offer.tipo_aplicacion}`);
      console.log(`    - Categoría ID: ${offer.categoria_id || 'null'}`);
      console.log(`    - Subcategoría ID: ${offer.subcategoria_id || 'null'}`);
      console.log(`    - Descuento: ${offer.tipo_descuento} ${offer.valor_descuento}`);

      // Check if this offer applies to our product
      let applies = false;
      if (offer.tipo_aplicacion === 'grupo') {
        if (offer.subcategoria_id && offer.subcategoria_id === product.subcategory_id) {
          applies = true;
          console.log(`    ✅ APLICA (subcategoría coincide)`);
        } else if (offer.categoria_id && offer.categoria_id === product.category_id) {
          applies = true;
          console.log(`    ✅ APLICA (categoría coincide)`);
        } else {
          console.log(`    ❌ NO APLICA (no coincide categoría/subcategoría)`);
        }
      } else if (offer.tipo_aplicacion === 'multiple') {
        console.log(`    ℹ️  Verificar en offer_items...`);
      }
    });

    await conn.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
