const db = require('./src/utils/database');

(async () => {
  try {
    console.log('=== TESTING COUPON 000006 ===\n');

    // Query coupon
    const query = `
      SELECT c.*
      FROM coupons c
      WHERE c.codigo = ?
      AND c.deleted_at IS NULL
    `;

    const coupons = await db.query(query, ['000006']);

    if (coupons.length === 0) {
      console.log('❌ Cupón 000006 NO encontrado');
    } else {
      console.log('✅ Cupón encontrado:');
      console.log(JSON.stringify(coupons[0], null, 2));
    }

    console.log('\n=== TESTING OFFER 000002 ===\n');

    // Query offer
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayField = `aplica_${dayNames[dayOfWeek]}`;
    const currentTime = now.toTimeString().split(' ')[0];
    const currentDate = now.toISOString().split('T')[0];

    console.log(`Hoy es: ${dayNames[dayOfWeek]} (${dayOfWeek})`);
    console.log(`Fecha: ${currentDate}`);
    console.log(`Hora: ${currentTime}`);
    console.log(`Buscando ofertas con ${dayField} = 1\n`);

    const offerQuery = `
      SELECT o.*
      FROM offers o
      WHERE o.codigo = ?
      AND o.deleted_at IS NULL
    `;

    const offers = await db.query(offerQuery, ['000002']);

    if (offers.length === 0) {
      console.log('❌ Oferta 000002 NO encontrada');
    } else {
      const offer = offers[0];
      console.log('✅ Oferta encontrada:');
      console.log(`  ID: ${offer.id}`);
      console.log(`  Código: ${offer.codigo}`);
      console.log(`  Nombre: ${offer.nombre}`);
      console.log(`  Activa: ${offer.is_active}`);
      console.log(`  Suspendida: ${offer.suspendida}`);
      console.log(`  ${dayField}: ${offer[dayField]}`);
      console.log(`  Limitar fecha: ${offer.limitar_fecha}`);
      console.log(`  Limitar hora: ${offer.limitar_hora}`);
      console.log(`  Tipo aplicación: ${offer.tipo_aplicacion}`);
      console.log(`  Categoría ID: ${offer.categoria_id}`);
      console.log(`  Subcategoría ID: ${offer.subcategoria_id}`);
      console.log(`  Producto ID: ${offer.producto_id}`);
      console.log(`  Tipo descuento: ${offer.tipo_descuento}`);
      console.log(`  Valor descuento: ${offer.valor_descuento}`);

      // Check if should be active now
      let shouldBeActive = true;
      let reason = '';

      if (!offer.is_active) {
        shouldBeActive = false;
        reason = 'is_active = 0';
      } else if (offer.suspendida) {
        shouldBeActive = false;
        reason = 'suspendida = 1';
      } else if (!offer[dayField]) {
        shouldBeActive = false;
        reason = `${dayField} = 0 (no aplica hoy)`;
      } else if (offer.limitar_fecha && (offer.fecha_desde > currentDate || offer.fecha_hasta < currentDate)) {
        shouldBeActive = false;
        reason = 'fuera del rango de fechas';
      } else if (offer.limitar_hora && (offer.hora_desde > currentTime || offer.hora_hasta < currentTime)) {
        shouldBeActive = false;
        reason = 'fuera del rango de horas';
      }

      console.log(`\n${shouldBeActive ? '✅' : '❌'} Debería aplicarse ahora: ${shouldBeActive ? 'SÍ' : 'NO'}`);
      if (!shouldBeActive) {
        console.log(`   Razón: ${reason}`);
      }
    }

    // Check products
    console.log('\n=== CHECKING PRODUCTS ===\n');

    const products = await db.query(`
      SELECT id, code, name, category_id, subcategory_id
      FROM products
      WHERE code IN ('C-0128-9', 'FF-0051-9')
    `);

    console.log('Productos encontrados:');
    products.forEach(p => {
      console.log(`  ${p.code} (ID: ${p.id})`);
      console.log(`    Categoría ID: ${p.category_id}`);
      console.log(`    Subcategoría ID: ${p.subcategory_id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
