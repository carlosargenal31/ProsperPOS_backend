const db = require('./src/utils/database');

async function testReprintFields() {
  try {
    console.log('=== VERIFICANDO CAMPOS ADICIONALES EN FACTURAS ===\n');

    // Buscar facturas que tengan campos adicionales
    const query = `
      SELECT
        id,
        invoice_number,
        customer_name,
        orden_compra,
        constancia_exonerado,
        registro_sag,
        issue_date,
        created_at
      FROM invoices
      WHERE orden_compra IS NOT NULL
         OR constancia_exonerado IS NOT NULL
         OR registro_sag IS NOT NULL
      ORDER BY id DESC
      LIMIT 5
    `;

    const results = await db.query(query);

    if (results.length === 0) {
      console.log('❌ NO SE ENCONTRARON facturas con campos adicionales');
      console.log('\nBuscando las últimas 5 facturas...\n');

      const allInvoices = await db.query(`
        SELECT
          id,
          invoice_number,
          customer_name,
          orden_compra,
          constancia_exonerado,
          registro_sag,
          issue_date
        FROM invoices
        ORDER BY id DESC
        LIMIT 5
      `);

      console.log('Últimas 5 facturas:');
      allInvoices.forEach(inv => {
        console.log(`\nID: ${inv.id}`);
        console.log(`Número: ${inv.invoice_number}`);
        console.log(`Cliente: ${inv.customer_name}`);
        console.log(`Orden Compra: ${inv.orden_compra || 'NULL'}`);
        console.log(`Constancia: ${inv.constancia_exonerado || 'NULL'}`);
        console.log(`Registro SAG: ${inv.registro_sag || 'NULL'}`);
      });
    } else {
      console.log(`✅ SE ENCONTRARON ${results.length} facturas con campos adicionales:\n`);

      results.forEach((invoice, index) => {
        console.log(`--- Factura #${index + 1} ---`);
        console.log(`ID: ${invoice.id}`);
        console.log(`Número: ${invoice.invoice_number}`);
        console.log(`Cliente: ${invoice.customer_name}`);
        console.log(`Orden Compra: "${invoice.orden_compra}"`);
        console.log(`Constancia Exonerado: "${invoice.constancia_exonerado}"`);
        console.log(`Registro SAG: "${invoice.registro_sag}"`);
        console.log(`Fecha: ${invoice.issue_date}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testReprintFields();
