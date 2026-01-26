const db = require('./src/utils/database');

async function testOffersQuery() {
  try {
    console.log('=== Testing Offers Query ===\n');

    // Get current date/time info
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayField = `aplica_${dayNames[dayOfWeek]}`;
    const currentTime = now.toTimeString().split(' ')[0];
    const currentDate = now.toISOString().split('T')[0];

    console.log('Current Date:', currentDate);
    console.log('Current Time:', currentTime);
    console.log('Day of Week:', dayNames[dayOfWeek]);
    console.log('Day Field:', dayField);
    console.log('\n=== All Active Offers ===\n');

    // First, get all active offers without filters
    const allOffersQuery = `
      SELECT id, codigo, nombre, is_active, suspendida,
             aplica_lunes, aplica_martes, aplica_miercoles, aplica_jueves,
             aplica_viernes, aplica_sabado, aplica_domingo,
             limitar_fecha, fecha_desde, fecha_hasta,
             limitar_hora, hora_desde, hora_hasta,
             tipo_descuento, valor_descuento,
             categoria_id, subcategoria_id, producto_id,
             tipo_aplicacion
      FROM offers
      WHERE deleted_at IS NULL
      AND is_active = 1
      AND suspendida = 0
    `;

    const allOffers = await db.query(allOffersQuery);
    console.log(`Found ${allOffers.length} active offers:`);

    allOffers.forEach(offer => {
      console.log(`\nOffer ID: ${offer.id}`);
      console.log(`  Code: ${offer.codigo}`);
      console.log(`  Name: ${offer.nombre}`);
      console.log(`  Days: L:${offer.aplica_lunes} M:${offer.aplica_martes} X:${offer.aplica_miercoles} J:${offer.aplica_jueves} V:${offer.aplica_viernes} S:${offer.aplica_sabado} D:${offer.aplica_domingo}`);
      console.log(`  Today (${dayField}): ${offer[dayField]}`);
      console.log(`  Date Limit: ${offer.limitar_fecha} (${offer.fecha_desde} - ${offer.fecha_hasta})`);
      console.log(`  Time Limit: ${offer.limitar_hora} (${offer.hora_desde} - ${offer.hora_hasta})`);
      console.log(`  Discount: ${offer.tipo_descuento} - ${offer.valor_descuento}`);
      console.log(`  Application: ${offer.tipo_aplicacion}`);
      console.log(`  Category: ${offer.categoria_id}, Subcategory: ${offer.subcategoria_id}, Product: ${offer.producto_id}`);
    });

    console.log('\n=== Filtered Offers (with day/time) ===\n');

    // Now with filters
    const query = `
      SELECT o.*
      FROM offers o
      WHERE o.deleted_at IS NULL
      AND o.is_active = 1
      AND o.suspendida = 0
      AND o.${dayField} = 1
      AND (o.limitar_fecha = 0 OR (o.fecha_desde <= ? AND o.fecha_hasta >= ?))
      AND (o.limitar_hora = 0 OR (o.hora_desde <= ? AND o.hora_hasta >= ?))
    `;

    const offers = await db.query(query, [currentDate, currentDate, currentTime, currentTime]);
    console.log(`Found ${offers.length} filtered offers\n`);

    if (offers.length > 0) {
      console.log('Offers that match filters:');
      offers.forEach(offer => {
        console.log(`- ${offer.codigo}: ${offer.nombre}`);
      });
    } else {
      console.log('No offers match the current day/time filters');
      console.log('\nPossible reasons:');
      console.log(`1. Today is ${dayNames[dayOfWeek]}, check if offers have ${dayField} = 1`);
      console.log(`2. Current time is ${currentTime}, check hora_desde and hora_hasta`);
      console.log(`3. Current date is ${currentDate}, check fecha_desde and fecha_hasta`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testOffersQuery();
