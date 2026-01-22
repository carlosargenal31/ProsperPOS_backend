require('dotenv').config();
const db = require('./src/utils/database');

async function checkTables() {
  try {
    await db.connectDatabase();

    // Check sales table
    console.log('📋 Estructura de la tabla sales:\n');
    const salesCols = await db.query(`SHOW COLUMNS FROM sales`);
    salesCols.forEach(col => {
      console.log(`   ${col.Field} (${col.Type})`);
    });

    console.log('\n──────────────────────────────\n');

    // Check invoice_payments if exists
    try {
      console.log('📋 Estructura de la tabla invoice_payments:\n');
      const paymentsCols = await db.query(`SHOW COLUMNS FROM invoice_payments`);
      paymentsCols.forEach(col => {
        console.log(`   ${col.Field} (${col.Type})`);
      });
    } catch (e) {
      console.log('⚠️ Tabla invoice_payments no existe');
    }

    console.log('\n──────────────────────────────\n');

    // Check what's in sales
    const salesSample = await db.query(`
      SELECT id, invoice_id, payment_method, total_amount, created_at
      FROM sales
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('📊 Muestra de ventas recientes:\n');
    if (salesSample.length === 0) {
      console.log('   ⚠️ No hay ventas registradas');
    } else {
      salesSample.forEach(s => {
        console.log(`   ID: ${s.id} | Factura: ${s.invoice_id} | Método: ${s.payment_method} | Total: L. ${s.total_amount}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkTables();
