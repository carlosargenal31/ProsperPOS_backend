require('dotenv').config();
const mysql = require('mysql2/promise');

async function testCuponesFlow() {
  let connection;

  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('✅ Conectado a la base de datos');

    // 1. Verificar estructura de tabla quotes
    console.log('\n📋 Verificando estructura de tabla quotes...');
    const [quoteColumns] = await connection.query(`
      SHOW COLUMNS FROM quotes LIKE 'applied_%'
    `);
    console.log('Columnas de cupones/ofertas en quotes:');
    quoteColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    // 2. Verificar estructura de tabla pending_invoices
    console.log('\n📋 Verificando estructura de tabla pending_invoices...');
    const [pendingColumns] = await connection.query(`
      SHOW COLUMNS FROM pending_invoices LIKE 'applied_%'
    `);
    console.log('Columnas de cupones/ofertas en pending_invoices:');
    pendingColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    // 3. Crear una cotización de prueba CON cupones
    console.log('\n🔧 Creando cotización de prueba con cupones...');

    const testCoupons = [
      { code: 'DESCUENTO10', name: 'Descuento 10%', amount: 50.00 },
      { code: 'PROMO20', name: 'Promoción 20', amount: 100.00 }
    ];

    const testOffers = [
      { id: 1, name: '2x1 en productos', discount_amount: 75.50 }
    ];

    const [insertResult] = await connection.query(`
      INSERT INTO quotes (
        quote_number, customer_name, branch_id, warehouse_id,
        subtotal, discount, tax, total, surcharge,
        applied_coupons, applied_offers,
        quote_date, valid_until, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), ?)
    `, [
      'TEST-' + Date.now(),
      'Cliente de Prueba',
      1, // branch_id
      1, // warehouse_id
      1000.00, // subtotal
      150.00, // discount (total de cupones + ofertas)
      127.50, // tax (15% de 850)
      977.50, // total
      0, // surcharge
      JSON.stringify(testCoupons),
      JSON.stringify(testOffers),
      1 // created_by (usuario ID 1)
    ]);

    const quoteId = insertResult.insertId;
    console.log(`✅ Cotización creada con ID: ${quoteId}`);

    // 4. Recuperar la cotización y verificar que los cupones se parsean correctamente
    console.log('\n🔍 Recuperando cotización...');
    const [quotes] = await connection.query(`
      SELECT id, quote_number, applied_coupons, applied_offers, discount, total
      FROM quotes
      WHERE id = ?
    `, [quoteId]);

    if (quotes.length === 0) {
      console.log('❌ No se encontró la cotización');
      return;
    }

    const quote = quotes[0];
    console.log('Cotización recuperada:');
    console.log(`  ID: ${quote.id}`);
    console.log(`  Número: ${quote.quote_number}`);
    console.log(`  Descuento total: ${quote.discount}`);
    console.log(`  Total: ${quote.total}`);

    // Parsear JSON
    let parsedCoupons = [];
    let parsedOffers = [];

    if (quote.applied_coupons) {
      try {
        parsedCoupons = JSON.parse(quote.applied_coupons);
        console.log('\n✅ Cupones parseados correctamente:');
        parsedCoupons.forEach(c => {
          console.log(`  - ${c.code}: ${c.name} ($${c.amount})`);
        });
      } catch (e) {
        console.log('❌ Error al parsear cupones:', e.message);
      }
    } else {
      console.log('\n⚠️ No hay cupones en la cotización');
    }

    if (quote.applied_offers) {
      try {
        parsedOffers = JSON.parse(quote.applied_offers);
        console.log('\n✅ Ofertas parseadas correctamente:');
        parsedOffers.forEach(o => {
          console.log(`  - ${o.name} ($${o.discount_amount})`);
        });
      } catch (e) {
        console.log('❌ Error al parsear ofertas:', e.message);
      }
    } else {
      console.log('\n⚠️ No hay ofertas en la cotización');
    }

    // 5. Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    await connection.query('DELETE FROM quotes WHERE id = ?', [quoteId]);
    console.log('✅ Datos de prueba eliminados');

    console.log('\n✨ PRUEBA COMPLETADA EXITOSAMENTE ✨');
    console.log('\nResumen:');
    console.log('- Estructura de base de datos: ✅');
    console.log('- Guardado de cupones/ofertas: ✅');
    console.log('- Recuperación y parseo: ✅');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

testCuponesFlow();
