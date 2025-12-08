require('dotenv').config();
const db = require('./src/utils/database');

async function testQuery() {
  try {
    await db.connectDatabase();

    const salesQuery = `
      SELECT
        YEAR(issue_date) as year,
        MONTH(issue_date) as month,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as amount
      FROM invoices
      WHERE DATE(issue_date) BETWEEN ? AND ?
        AND payment_status = 'paid'
        AND deleted_at IS NULL
      GROUP BY YEAR(issue_date), MONTH(issue_date)
      ORDER BY YEAR(issue_date) ASC, MONTH(issue_date) ASC
    `;

    console.log('📊 Ejecutando query...');
    const result = await db.execute(salesQuery, ['2025-09-05', '2025-12-04']);

    console.log('📊 Resultado completo:', result);
    console.log('📊 result.length:', result.length);
    console.log('📊 result[0] type:', typeof result[0]);
    console.log('📊 result[0] is array?:', Array.isArray(result[0]));
    console.log('📊 result[0]:', JSON.stringify(result[0], null, 2));

    if (result[0]) {
      const [rows] = result;
      console.log('\n✅ Después de destructurar:');
      console.log('✅ rows type:', typeof rows);
      console.log('✅ rows is array?:', Array.isArray(rows));
      console.log('✅ rows:', JSON.stringify(rows, null, 2));

      if (!Array.isArray(rows) && typeof rows === 'object') {
        console.log('\n🔧 Convirtiendo con Object.values:');
        const arrayRows = Object.values(rows);
        console.log('🔧 arrayRows:', JSON.stringify(arrayRows, null, 2));
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testQuery();
