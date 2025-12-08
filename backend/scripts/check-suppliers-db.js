const db = require('../src/utils/database');

async function checkSuppliers() {
  try {
    console.log('🔍 Checking suppliers in database...\n');

    // Count total suppliers
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM suppliers WHERE deleted_at IS NULL');
    console.log('📊 Total Active Suppliers:', countResult[0].total);

    // Get all suppliers
    const [suppliers] = await db.query(`
      SELECT id, nombre, doc_identificacion, is_active, tipo_beneficiario
      FROM suppliers
      WHERE deleted_at IS NULL
      ORDER BY id ASC
    `);

    if (suppliers.length > 0) {
      console.log('\n📋 Suppliers in database:');
      suppliers.forEach((s, index) => {
        console.log(`  ${index + 1}. ID: ${s.id} | ${s.nombre} | RTN: ${s.doc_identificacion || 'N/A'} | Active: ${s.is_active}`);
      });

      console.log('\n✅ First supplier for reference:');
      console.log(JSON.stringify(suppliers[0], null, 2));
    } else {
      console.log('\n⚠️  No suppliers found in database!');
      console.log('💡 You may need to create suppliers first.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkSuppliers();
