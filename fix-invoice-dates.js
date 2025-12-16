const mysql = require('mysql2/promise');

async function fixInvoiceDates() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Corrigiendo fechas de facturas...');

    // Restar 6 horas a todas las issue_date que están adelantadas
    const [result] = await connection.query(`
      UPDATE invoices
      SET issue_date = DATE_SUB(issue_date, INTERVAL 6 HOUR)
      WHERE issue_date > created_at
    `);

    console.log(`✓ ${result.affectedRows} facturas actualizadas`);

    console.log('\nVerificando correcciones...');
    const [invoices] = await connection.query(`
      SELECT
        id,
        invoice_number,
        created_at,
        issue_date,
        TIMESTAMPDIFF(HOUR, created_at, issue_date) as hour_diff
      FROM invoices
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log('\nÚltimas 10 facturas:');
    invoices.forEach(inv => {
      console.log(`ID: ${inv.id} | Número: ${inv.invoice_number}`);
      console.log(`  Created: ${inv.created_at}`);
      console.log(`  Issue:   ${inv.issue_date}`);
      console.log(`  Diff:    ${inv.hour_diff} horas\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

fixInvoiceDates();
