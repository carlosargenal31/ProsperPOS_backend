const db = require('./src/utils/database');

async function checkPaymentMethods() {
  try {
    console.log('🔍 Revisando métodos de pago en invoice_payments...\n');

    const methods = await db.query(`
      SELECT DISTINCT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM invoice_payments
      WHERE deleted_at IS NULL
      GROUP BY payment_method
      ORDER BY total DESC
    `);

    console.log('📊 MÉTODOS DE PAGO ENCONTRADOS:');
    console.log('========================================');
    methods.forEach(method => {
      console.log(`${method.payment_method}: ${method.count} pagos, Total: L ${parseFloat(method.total).toFixed(2)}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPaymentMethods();
