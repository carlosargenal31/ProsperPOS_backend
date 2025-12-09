const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    const period = 'month';
    const daysBack = 30;

    // Calcular fechas
    const now = new Date();
    const currentStartDate = new Date(now);
    currentStartDate.setDate(currentStartDate.getDate() - daysBack);
    const currentStartStr = currentStartDate.toISOString().split('T')[0] + ' 00:00:00';
    const currentEndStr = now.toISOString().split('T')[0] + ' 23:59:59';

    console.log(`\n📊 DEBUG - Resumen Mensual (${daysBack} días)`);
    console.log(`📊 Período: ${currentStartStr} a ${currentEndStr}\n`);

    // Ver TODAS las facturas de CONSUMIDOR FINAL
    const [allInvoices] = await conn.execute(`
      SELECT i.id, i.issue_date, i.payment_status, i.deleted_at
      FROM invoices i
      INNER JOIN customers c ON i.customer_id = c.id
      WHERE c.nombre = 'CONSUMIDOR FINAL'
      ORDER BY i.issue_date DESC
      LIMIT 20
    `);

    console.log('📋 Últimas 20 facturas de CONSUMIDOR FINAL:');
    allInvoices.forEach(inv => {
      console.log(`   ID: ${inv.id} | Fecha: ${inv.issue_date} | Estado: ${inv.payment_status} | Borrado: ${inv.deleted_at}`);
    });

    // Buscar cliente CONSUMIDOR FINAL
    const [customer] = await conn.execute(`
      SELECT id, nombre FROM customers WHERE nombre = 'CONSUMIDOR FINAL'
    `);

    if (customer.length === 0) {
      console.log('\n❌ No se encontró CONSUMIDOR FINAL');
      await conn.end();
      return;
    }

    const customerId = customer[0].id;
    console.log(`\n✅ CONSUMIDOR FINAL encontrado - ID: ${customerId}`);

    // Contar facturas ANTES del período mensual
    const [beforeCount] = await conn.execute(`
      SELECT COUNT(*) as count
      FROM invoices
      WHERE customer_id = ?
        AND deleted_at IS NULL
        AND payment_status = 'paid'
        AND issue_date < ?
    `, [customerId, currentStartStr]);

    console.log(`📊 Facturas ANTES de ${currentStartStr}: ${beforeCount[0].count}`);

    // Contar facturas DENTRO del período mensual
    const [inPeriodCount] = await conn.execute(`
      SELECT COUNT(*) as count
      FROM invoices
      WHERE customer_id = ?
        AND deleted_at IS NULL
        AND payment_status = 'paid'
        AND issue_date >= ?
        AND issue_date <= ?
    `, [customerId, currentStartStr, currentEndStr]);

    console.log(`📊 Facturas DENTRO del período: ${inPeriodCount[0].count}`);

    // Verificar si aparece en la query principal
    const [inQuery] = await conn.execute(`
      SELECT
        c.id,
        c.nombre,
        (SELECT COUNT(*)
         FROM invoices i2
         WHERE i2.customer_id = c.id
           AND i2.deleted_at IS NULL
           AND i2.payment_status = 'paid'
           AND i2.issue_date < ?) as invoices_before_period
      FROM customers c
      INNER JOIN invoices i ON c.id = i.customer_id
      WHERE i.issue_date >= ?
        AND i.issue_date <= ?
        AND i.deleted_at IS NULL
        AND i.payment_status = 'paid'
        AND c.nombre = 'CONSUMIDOR FINAL'
      GROUP BY c.id, c.nombre
    `, [currentStartStr, currentStartStr, currentEndStr]);

    console.log(`\n📊 Aparece en query principal: ${inQuery.length > 0 ? 'SÍ' : 'NO'}`);
    if (inQuery.length > 0) {
      console.log(`   Facturas antes del período: ${inQuery[0].invoices_before_period}`);
      console.log(`   Tipo: ${inQuery[0].invoices_before_period > 0 ? 'RECURRENTE' : 'PRIMERA VEZ'}`);
    }

    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
