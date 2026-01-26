require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkLastInvoice() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('✅ Conectado a la base de datos\n');

    // Obtener la última factura
    const [invoices] = await connection.query(`
      SELECT
        id,
        invoice_number,
        customer_name,
        subtotal,
        discount_type,
        discount_value,
        discount_amount,
        tax_rate,
        tax_amount,
        shipping_cost,
        total,
        created_at
      FROM invoices
      ORDER BY id DESC
      LIMIT 5
    `);

    if (invoices.length === 0) {
      console.log('❌ No se encontraron facturas');
      return;
    }

    console.log('📋 Últimas 5 facturas:\n');
    invoices.forEach((inv, index) => {
      console.log(`${index + 1}. Factura #${inv.invoice_number} (ID: ${inv.id})`);
      console.log(`   Cliente: ${inv.customer_name}`);
      console.log(`   Subtotal: L ${inv.subtotal}`);
      console.log(`   Tipo descuento: ${inv.discount_type || 'N/A'}`);
      console.log(`   Valor descuento: ${inv.discount_value || 0}`);
      console.log(`   Monto descuento: L ${inv.discount_amount || 0}`);
      console.log(`   Tasa impuesto: ${inv.tax_rate || 15}%`);
      console.log(`   Monto impuesto (ISV): L ${inv.tax_amount}`);
      console.log(`   Recargos: L ${inv.shipping_cost || 0}`);
      console.log(`   TOTAL: L ${inv.total}`);
      console.log(`   Fecha: ${inv.created_at}`);

      // Calcular el total manualmente
      const totalDescuentos = parseFloat(inv.discount_amount) || 0;
      const subtotal = parseFloat(inv.subtotal) || 0;
      const taxAmount = parseFloat(inv.tax_amount) || 0;
      const shippingCost = parseFloat(inv.shipping_cost) || 0;
      const totalBD = parseFloat(inv.total) || 0;

      const subtotalDespuesDescuentos = subtotal - totalDescuentos;
      const totalCalculado = subtotalDespuesDescuentos + taxAmount + shippingCost;

      console.log(`\n   🧮 Verificación del cálculo:`);
      console.log(`   Subtotal: ${subtotal.toFixed(2)}`);
      console.log(`   - Descuento: ${totalDescuentos.toFixed(2)}`);
      console.log(`   = Subtotal después descuento: ${subtotalDespuesDescuentos.toFixed(2)}`);
      console.log(`   + ISV: ${taxAmount.toFixed(2)}`);
      console.log(`   + Recargos: ${shippingCost.toFixed(2)}`);
      console.log(`   = Total calculado: ${totalCalculado.toFixed(2)}`);
      console.log(`   Total en BD: ${totalBD.toFixed(2)}`);
      console.log(`   ✅ Match: ${Math.abs(totalCalculado - totalBD) < 0.01 ? 'SÍ' : 'NO ❌'}\n`);
      console.log('─'.repeat(70) + '\n');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkLastInvoice();
