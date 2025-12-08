require('dotenv').config();
const db = require('../src/utils/database');

async function testPurchasesQuery() {
  try {
    console.log('🔍 Verificando purchases_documents...\n');

    // Count total
    const countQuery = 'SELECT COUNT(*) as total FROM purchases_documents';
    const countResult = await db.query(countQuery);
    const total = countResult[0] ? countResult[0].total : 0;
    console.log(`📊 Total registros: ${total}\n`);

    if (total === 0) {
      console.log('❌ No hay registros en purchases_documents');
      process.exit(0);
    }

    // Get last 5 purchases
    const query = 'SELECT * FROM purchases_documents ORDER BY id DESC LIMIT 5';
    const purchases = await db.query(query);

    console.log(`✅ Últimos ${purchases.length} registros:\n`);
    purchases.forEach(p => {
      console.log(`ID: ${p.id}`);
      console.log(`  Número: ${p.purchase_number}`);
      console.log(`  Fecha: ${p.purchase_date}`);
      console.log(`  Proveedor: ${p.supplier_name}`);
      console.log(`  Total: L ${p.total_amount}`);
      console.log(`  Created: ${p.created_at}`);
      console.log('---');
    });

    // Test with date filters (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateFrom = firstDay.toISOString().split('T')[0];
    const dateTo = now.toISOString().split('T')[0];

    console.log(`\n🔍 Buscando compras entre ${dateFrom} y ${dateTo}...\n`);

    const filteredQuery = `
      SELECT * FROM purchases_documents
      WHERE DATE(purchase_date) >= ? AND DATE(purchase_date) <= ?
      ORDER BY id DESC
    `;
    const filtered = await db.query(filteredQuery, [dateFrom, dateTo]);

    console.log(`📊 Resultados con filtro de fecha: ${filtered.length} registros\n`);

    if (filtered.length > 0) {
      console.log('✅ Registros encontrados con filtro:');
      filtered.forEach(p => {
        console.log(`  - ID ${p.id}: ${p.purchase_date} (${p.supplier_name})`);
      });
    } else {
      console.log('❌ No se encontraron registros con el filtro de fecha');
      console.log('\n💡 Las fechas de las compras están fuera del rango de este mes.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testPurchasesQuery();
