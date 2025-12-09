const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    const period = 'week';
    const daysBack = 7;

    // Calcular fechas
    const now = new Date();
    const currentStartDate = new Date(now);
    currentStartDate.setDate(currentStartDate.getDate() - daysBack);
    const currentStartStr = currentStartDate.toISOString().split('T')[0] + ' 00:00:00';
    const currentEndStr = now.toISOString().split('T')[0] + ' 23:59:59';

    console.log(`\n📊 Probando Resumen de Clientes - Semanal (${daysBack} días)`);
    console.log(`📊 Período: ${currentStartStr} a ${currentEndStr}\n`);

    // Query actual
    const [customers] = await conn.execute(`
      SELECT
        c.id,
        c.nombre,
        (SELECT COUNT(*)
         FROM invoices i2
         WHERE i2.customer_id = c.id
           AND i2.deleted_at IS NULL
           AND i2.payment_status = 'paid'
           AND i2.issue_date < ?) as invoices_before_period,
        (SELECT COUNT(*)
         FROM invoices i3
         WHERE i3.customer_id = c.id
           AND i3.deleted_at IS NULL
           AND i3.payment_status = 'paid'
           AND i3.issue_date >= ?
           AND i3.issue_date <= ?) as invoices_in_period
      FROM customers c
      INNER JOIN invoices i ON c.id = i.customer_id
      WHERE i.issue_date >= ?
        AND i.issue_date <= ?
        AND i.deleted_at IS NULL
        AND i.payment_status = 'paid'
      GROUP BY c.id, c.nombre
      ORDER BY c.nombre
    `, [currentStartStr, currentStartStr, currentEndStr, currentStartStr, currentEndStr]);

    console.log(`Total clientes en período: ${customers.length}\n`);

    let firstTime = 0;
    let returning = 0;

    customers.forEach(customer => {
      const previousPurchases = parseInt(customer.invoices_before_period) || 0;
      const type = previousPurchases > 0 ? 'RECURRENTE' : 'PRIMERA VEZ';

      if (previousPurchases > 0) {
        returning++;
      } else {
        firstTime++;
      }

      console.log(`${type.padEnd(12)} | ${customer.nombre.padEnd(30)} | Facturas antes: ${customer.invoices_before_period} | Facturas en período: ${customer.invoices_in_period}`);
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log(`RESUMEN:`);
    console.log(`Primera Vez:  ${firstTime}`);
    console.log(`Recurrentes:  ${returning}`);
    console.log(`Total:        ${firstTime + returning}`);

    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
