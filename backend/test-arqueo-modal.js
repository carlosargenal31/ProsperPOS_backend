require('dotenv').config();
const db = require('./src/utils/database');

async function testArqueoModal() {
  try {
    await db.connectDatabase();
    console.log('🔍 Consultando arqueo para probar el modal...\n');

    // Obtener el arqueo
    const [session] = await db.query(`
      SELECT * FROM cash_register_sessions WHERE id = 5
    `);

    console.log('📋 Sesión de Arqueo:');
    console.log('ID:', session.id);
    console.log('Consecutivo:', session.consecutive);
    console.log('Fecha desde:', session.date_from);
    console.log('Hora desde:', session.time_from);
    console.log('Monto apertura:', session.opening_amount);
    console.log('Estado:', session.status);
    console.log('');

    // Calcular totales del sistema (ventas reales)
    const dateTimeFrom = `${session.date_from} ${session.time_from}`;
    const dateTimeTo = new Date().toISOString().slice(0, 19).replace('T', ' ');

    console.log('📊 Buscando ventas desde:', dateTimeFrom);
    console.log('📊 Hasta:', dateTimeTo);
    console.log('');

    const salesQuery = `
      SELECT
        payment_method,
        COUNT(*) as cantidad,
        SUM(total_amount) as total
      FROM invoices
      WHERE user_id = ?
        AND created_at >= ?
        AND created_at <= ?
        AND status != 'CANCELADA'
      GROUP BY payment_method
    `;

    const sales = await db.query(salesQuery, [
      session.user_id,
      dateTimeFrom,
      dateTimeTo
    ]);

    console.log('💰 Ventas por forma de pago:');
    if (sales.length === 0) {
      console.log('   ⚠️ No se encontraron ventas');
    } else {
      sales.forEach(sale => {
        console.log(`   ${sale.payment_method}: ${sale.cantidad} facturas - L. ${parseFloat(sale.total).toFixed(2)}`);
      });
    }
    console.log('');

    // Calcular totales
    const totals = {
      total_cash: 0,
      total_card: 0,
      total_transfer: 0,
      total_credit_note: 0,
      total_check: 0,
      total_general: 0
    };

    sales.forEach(sale => {
      const amount = parseFloat(sale.total || 0);
      switch (sale.payment_method) {
        case 'EFECTIVO':
          totals.total_cash += amount;
          break;
        case 'TARJETA':
        case 'TARJ. CREDITO':
        case 'TARJ. DEBITO':
          totals.total_card += amount;
          break;
        case 'TRANSFERENCIA':
          totals.total_transfer += amount;
          break;
        case 'NOTA DE CREDITO':
          totals.total_credit_note += amount;
          break;
        case 'CHEQUE':
          totals.total_check += amount;
          break;
      }
      totals.total_general += amount;
    });

    // Sumar apertura de caja
    totals.total_cash += parseFloat(session.opening_amount || 0);
    totals.total_general += parseFloat(session.opening_amount || 0);

    console.log('📈 Totales según sistema:');
    console.log('   Efectivo:', `L. ${totals.total_cash.toFixed(2)} (incluye apertura: L. ${parseFloat(session.opening_amount).toFixed(2)})`);
    console.log('   Tarjeta:', `L. ${totals.total_card.toFixed(2)}`);
    console.log('   Transferencia:', `L. ${totals.total_transfer.toFixed(2)}`);
    console.log('   Nota de Crédito:', `L. ${totals.total_credit_note.toFixed(2)}`);
    console.log('   Cheque:', `L. ${totals.total_check.toFixed(2)}`);
    console.log('   ─────────────────────────');
    console.log('   TOTAL GENERAL:', `L. ${totals.total_general.toFixed(2)}`);
    console.log('');

    console.log('✅ El modal debería mostrar estos datos cuando se cargue');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testArqueoModal();
