require('dotenv').config();
const db = require('./src/utils/database');

async function checkStructure() {
  try {
    await db.connectDatabase();

    const columns = await db.query(`
      SHOW COLUMNS FROM invoices
    `);

    console.log('📋 Estructura de la tabla invoices:\n');
    columns.forEach(col => {
      console.log(`${col.Field} (${col.Type})`);
    });

    console.log('\n🔍 Buscando columnas relacionadas con pago:');
    const paymentCols = columns.filter(col =>
      col.Field.toLowerCase().includes('pay') ||
      col.Field.toLowerCase().includes('metod') ||
      col.Field.toLowerCase().includes('forma')
    );

    if (paymentCols.length > 0) {
      paymentCols.forEach(col => {
        console.log(`   ✓ ${col.Field}`);
      });
    } else {
      console.log('   ⚠️ No se encontraron columnas de pago');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStructure();
