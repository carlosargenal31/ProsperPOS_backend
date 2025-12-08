require('dotenv').config();
const db = require('../src/utils/database');

const columnsToRemove = [
  'resolution',
  'affected_document',
  'buyer_name',
  'payment_status',
  'retention_amount',
  'discount_amount',
  'surcharge_amount',
  'returned_amount',
  'paid_amount',
  'balance_amount',
  'warehouse_id'
];

async function removeColumns() {
  try {
    console.log('🔍 Verificando columnas de purchases_documents...\n');

    // Get current columns
    const columns = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
        AND TABLE_NAME = 'purchases_documents'
    `);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    console.log('📋 Columnas actuales:', existingColumns.join(', '), '\n');

    // Remove each column
    for (const columnName of columnsToRemove) {
      if (existingColumns.includes(columnName)) {
        console.log(`🗑️  Eliminando columna: ${columnName}...`);
        await db.query(`ALTER TABLE purchases_documents DROP COLUMN ${columnName}`);
        console.log(`✅ Columna ${columnName} eliminada`);
      } else {
        console.log(`⏭️  Columna ${columnName} no existe, saltando...`);
      }
    }

    // Show final columns
    const finalColumns = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
        AND TABLE_NAME = 'purchases_documents'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n✅ Columnas restantes en purchases_documents:');
    finalColumns.forEach(c => {
      console.log(`   - ${c.COLUMN_NAME}`);
    });

    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

removeColumns();
