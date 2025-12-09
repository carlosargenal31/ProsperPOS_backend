const db = require('./src/utils/database');

async function testSalesBook() {
  try {
    console.log('=== TESTING SALES BOOK QUERY ===\n');

    // Test 1: Ver warehouses
    console.log('1. Warehouses en la BD:');
    const warehouses = await db.execute('SELECT id, nombre, tipo FROM warehouses LIMIT 10');
    console.table(warehouses);

    // Test 2: Ver tipos de documentos
    console.log('\n2. Tipos de documentos (invoice_type):');
    const types = await db.execute('SELECT DISTINCT invoice_type FROM invoices');
    console.table(types);

    // Test 3: Ver payment_status
    console.log('\n3. Payment status:');
    const statuses = await db.execute('SELECT DISTINCT payment_status FROM invoices');
    console.table(statuses);

    // Test 4: Ver invoices con warehouse
    console.log('\n4. Sample invoices con warehouses:');
    const invoices = await db.execute(`
      SELECT
        i.id,
        i.invoice_number,
        i.warehouse_id,
        w.nombre as warehouse_nombre,
        w.tipo as warehouse_tipo,
        i.invoice_type,
        i.payment_status
      FROM invoices i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE DATE(i.issue_date) >= '2025-11-01'
      LIMIT 10
    `);
    console.table(invoices);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSalesBook();
