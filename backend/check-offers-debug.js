const db = require('./src/utils/database');

async function checkOffers() {
  try {
    console.log('=== OFERTAS ACTIVAS ===\n');

    const offers = await db.query(`
      SELECT
        o.id,
        o.nombre,
        o.tipo_aplicacion,
        o.tipo_descuento,
        o.valor_descuento,
        o.categoria_id,
        o.subcategoria_id,
        o.producto_id,
        o.aplica_para,
        o.monto_minimo,
        o.cantidad_minima,
        o.limitar_fecha,
        o.fecha_desde,
        o.fecha_hasta,
        o.limitar_hora,
        o.hora_desde,
        o.hora_hasta,
        o.aplica_lunes,
        o.aplica_martes,
        o.aplica_miercoles,
        o.aplica_jueves,
        o.aplica_viernes,
        o.aplica_sabado,
        o.aplica_domingo,
        o.is_active,
        o.suspendida,
        c.name as categoria_nombre,
        sc.name as subcategoria_nombre
      FROM offers o
      LEFT JOIN categories c ON o.categoria_id = c.id
      LEFT JOIN subcategories sc ON o.subcategoria_id = sc.id
      WHERE o.deleted_at IS NULL
      AND o.is_active = 1
      AND o.suspendida = 0
      ORDER BY o.id DESC
    `);

    if (offers.length === 0) {
      console.log('No hay ofertas activas en el sistema.');
    } else {
      offers.forEach(offer => {
        console.log(`ID: ${offer.id}`);
        console.log(`Nombre: ${offer.nombre}`);
        console.log(`Tipo aplicación: ${offer.tipo_aplicacion}`);
        console.log(`Tipo descuento: ${offer.tipo_descuento} - ${offer.valor_descuento}%`);
        console.log(`Categoría ID: ${offer.categoria_id} - ${offer.categoria_nombre || 'N/A'}`);
        console.log(`Subcategoría ID: ${offer.subcategoria_id} - ${offer.subcategoria_nombre || 'N/A'}`);
        console.log(`Producto ID: ${offer.producto_id || 'N/A'}`);
        console.log(`Aplica para: ${offer.aplica_para}`);
        console.log(`Monto mínimo: ${offer.monto_minimo || 'N/A'}`);
        console.log(`Cantidad mínima: ${offer.cantidad_minima || 'N/A'}`);

        if (offer.limitar_fecha) {
          console.log(`Fechas: ${offer.fecha_desde} a ${offer.fecha_hasta}`);
        }

        if (offer.limitar_hora) {
          console.log(`Horas: ${offer.hora_desde} a ${offer.hora_hasta}`);
        }

        const days = [];
        if (offer.aplica_lunes) days.push('Lun');
        if (offer.aplica_martes) days.push('Mar');
        if (offer.aplica_miercoles) days.push('Mié');
        if (offer.aplica_jueves) days.push('Jue');
        if (offer.aplica_viernes) days.push('Vie');
        if (offer.aplica_sabado) days.push('Sáb');
        if (offer.aplica_domingo) days.push('Dom');
        console.log(`Días aplicables: ${days.join(', ') || 'Todos'}`);

        console.log('---\n');
      });
    }

    console.log('\n=== PRODUCTOS EN CARRITO ===\n');

    // Productos de ceramica para piso 46x46
    const products = await db.query(`
      SELECT
        p.id,
        p.name,
        p.code,
        p.category_id,
        p.subcategory_id,
        c.name as categoria,
        sc.name as subcategoria
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.code IN ('FF-0050-9', 'FM-0021-9', 'C-0128-9')
      AND p.deleted_at IS NULL
    `);

    products.forEach(prod => {
      console.log(`ID: ${prod.id}`);
      console.log(`Nombre: ${prod.name}`);
      console.log(`Código: ${prod.code}`);
      console.log(`Categoría ID: ${prod.category_id} - ${prod.categoria}`);
      console.log(`Subcategoría ID: ${prod.subcategory_id} - ${prod.subcategoria}`);
      console.log('---\n');
    });

    console.log('\n=== VALIDACIÓN DE OFERTA ===\n');

    // Simular el día actual
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayField = `aplica_${dayNames[dayOfWeek]}`;
    console.log(`Hoy es: ${dayNames[dayOfWeek]} (${dayOfWeek})`);
    console.log(`Campo de día: ${dayField}\n`);

    // Verificar qué ofertas aplican
    offers.forEach(offer => {
      console.log(`Oferta: ${offer.nombre} (ID: ${offer.id})`);

      // Verificar día
      const dayApplies = offer[dayField] === 1;
      console.log(`  - Aplica hoy (${dayField}): ${dayApplies ? 'SÍ' : 'NO'}`);

      // Verificar cada producto
      products.forEach(prod => {
        let applies = false;
        let reason = '';

        if (offer.tipo_aplicacion === 'grupo') {
          if (offer.categoria_id && offer.subcategoria_id) {
            applies = prod.category_id === offer.categoria_id && prod.subcategory_id === offer.subcategoria_id;
            reason = `Categoría ${prod.category_id} === ${offer.categoria_id} && Subcategoría ${prod.subcategory_id} === ${offer.subcategoria_id}`;
          } else if (offer.categoria_id) {
            applies = prod.category_id === offer.categoria_id;
            reason = `Categoría ${prod.category_id} === ${offer.categoria_id}`;
          } else if (offer.subcategoria_id) {
            applies = prod.subcategory_id === offer.subcategoria_id;
            reason = `Subcategoría ${prod.subcategory_id} === ${offer.subcategoria_id}`;
          } else if (offer.producto_id) {
            applies = prod.id === offer.producto_id;
            reason = `Producto ${prod.id} === ${offer.producto_id}`;
          } else {
            applies = true;
            reason = 'Todos los productos';
          }
        } else {
          applies = true;
          reason = 'Tipo aplicación: ' + offer.tipo_aplicacion;
        }

        console.log(`  - ${prod.code} (${prod.name.substring(0, 40)}...): ${applies ? '✓ APLICA' : '✗ NO APLICA'}`);
        console.log(`    Razón: ${reason}`);
      });

      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOffers();
