const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    const dateFrom = '2025-11-01';
    const dateTo = '2025-12-10';

    console.log('Probando query con fechas:', dateFrom, 'a', dateTo);

    const [customers] = await conn.execute(`
      SELECT
        c.id,
        c.nombre as name,
        COUNT(DISTINCT i.id) as total_invoices,
        COALESCE(SUM(i.total), 0) as total_spent
      FROM customers c
      INNER JOIN invoices i ON c.id = i.customer_id
      WHERE i.deleted_at IS NULL
        AND i.payment_status = 'paid'
        AND c.is_active = 1
        AND i.issue_date >= ?
        AND i.issue_date <= ?
      GROUP BY c.id, c.nombre
      HAVING total_invoices > 0
      ORDER BY total_spent DESC
      LIMIT 10
    `, [dateFrom + ' 00:00:00', dateTo + ' 23:59:59']);

    console.log('\n=== RESULTADO ===');
    console.log('Total clientes encontrados:', customers.length);
    console.log('\nClientes:');
    customers.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} - ${c.total_invoices} facturas - L${c.total_spent}`);
    });

    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
