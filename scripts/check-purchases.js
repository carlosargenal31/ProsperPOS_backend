const db = require('../src/utils/database');

async function checkPurchases() {
  try {
    console.log('🔍 Verificando purchases_documents...\n');

    // Count total
    const countQuery = 'SELECT COUNT(*) as total FROM purchases_documents';
    const [countResult] = await db.query(countQuery);
    console.log(`📊 Total registros: ${countResult[0].total}\n`);

    // Get all purchases
    const query = 'SELECT * FROM purchases_documents ORDER BY id DESC LIMIT 10';
    const [purchases] = await db.query(query);

    if (purchases.length === 0) {
      console.log('❌ No hay registros en purchases_documents');
    } else {
      console.log(`✅ Se encontraron ${purchases.length} registros:\n`);
      purchases.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`  Número: ${p.purchase_number}`);
        console.log(`  Fecha: ${p.purchase_date}`);
        console.log(`  Proveedor: ${p.supplier_name}`);
        console.log(`  Total: L ${p.total_amount}`);
        console.log(`  Created: ${p.created_at}`);
        console.log('---');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkPurchases();
