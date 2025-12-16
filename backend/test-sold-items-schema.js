// Script para verificar el esquema de las tablas necesarias
const db = require('./src/utils/database');

async function testSchema() {
  try {
    console.log('=== Verificando esquema de tablas ===\n');

    // 1. Verificar columnas de invoices
    console.log('1. Columnas de la tabla invoices:');
    const [invoicesColumns] = await db.query(`
      DESCRIBE invoices
    `);
    invoicesColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    // 2. Verificar columnas de invoice_items
    console.log('\n2. Columnas de la tabla invoice_items:');
    const [itemsColumns] = await db.query(`
      DESCRIBE invoice_items
    `);
    itemsColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    // 3. Verificar columnas de products
    console.log('\n3. Columnas de la tabla products:');
    const [productsColumns] = await db.query(`
      DESCRIBE products
    `);
    productsColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    // 4. Probar una consulta simple
    console.log('\n4. Probando consulta simple:');
    const [testQuery] = await db.query(`
      SELECT
        i.id AS invoice_id,
        i.invoice_number,
        i.created_at AS invoice_date,
        ii.id AS item_id,
        ii.quantity,
        ii.unit_price,
        ii.subtotal,
        ii.tax_amount,
        p.id AS product_id,
        p.name AS product_name,
        p.code AS product_code
      FROM invoices i
      INNER JOIN invoice_items ii ON i.id = ii.invoice_id
      INNER JOIN products p ON ii.product_id = p.id
      WHERE i.deleted_at IS NULL
      LIMIT 5
    `);
    console.log(`   Registros encontrados: ${testQuery.length}`);
    if (testQuery.length > 0) {
      console.log('   Primer registro:', JSON.stringify(testQuery[0], null, 2));
    }

    // 5. Verificar invoice_type
    console.log('\n5. Verificando tipos de documento en invoices:');
    const [docTypes] = await db.query(`
      SELECT DISTINCT invoice_type
      FROM invoices
      WHERE deleted_at IS NULL
      LIMIT 10
    `);
    console.log('   Tipos encontrados:', docTypes.map(d => d.invoice_type));

    console.log('\n=== Prueba completada ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testSchema();
