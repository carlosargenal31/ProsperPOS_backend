require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyTotals() {
  let connection;

  try {
    console.log('🔍 VERIFICACIÓN DIRECTA DE TOTALES - BASE DE DATOS\n');

    // Crear conexión directa a MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('✅ Conectado a la base de datos\n');

    // Query exactamente igual al del servicio
    const query = `
      SELECT
        i.id,
        DATE_FORMAT(i.created_at, '%d/%m/%Y %H:%i:%S') as fecha_operacion,
        i.created_at as fecha_operacion_raw,
        COALESCE(b.nombre, 'N/A') as sucursal,
        UPPER(i.invoice_type) as tipo_documento,
        i.invoice_number as nro_documento,
        CASE
          WHEN i.payment_status = 'paid' THEN 'COBRADO'
          WHEN i.payment_status = 'partial' THEN 'ABONOS'
          WHEN i.payment_status = 'pending' THEN 'PENDIENTE'
          WHEN i.payment_status = 'returned' THEN 'DEVUELTO'
          ELSE UPPER(i.payment_status)
        END as estatus,
        i.payment_status as estatus_raw,
        COALESCE(i.subtotal, 0) as subtotal,
        COALESCE(i.discount_amount, 0) as descuento,
        COALESCE(i.tax_amount, 0) as impuesto,
        COALESCE(i.shipping_cost, 0) as recargos,
        COALESCE(i.total, 0) as total,
        'FACTURA' as tipo_fila

      FROM invoices i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN users u ON i.seller_id = u.id
      WHERE i.deleted_at IS NULL
      AND DATE(i.created_at) >= ?
      AND DATE(i.created_at) <= ?

      UNION ALL

      SELECT
        CONCAT('CN-', cn.id) as id,
        DATE_FORMAT(cn.created_at, '%d/%m/%Y %H:%i:%S') as fecha_operacion,
        cn.created_at as fecha_operacion_raw,
        COALESCE(b.nombre, 'N/A') as sucursal,
        'DEVOLUCION' as tipo_documento,
        CONCAT('DEV-', LPAD(cn.id, 6, '0')) as nro_documento,
        CONCAT('NC-', COALESCE(cn.credit_note_number, LPAD(cn.id, 6, '0')), ' - DEVUELTO') as estatus,
        'returned' as estatus_raw,
        -COALESCE(cn.subtotal + cn.discount, 0) as subtotal,
        -COALESCE(cn.discount, 0) as descuento,
        -COALESCE(cn.tax, 0) as impuesto,
        -COALESCE(cn.shipping_cost, 0) as recargos,
        -COALESCE(cn.total, 0) as total,
        'DEVOLUCION' as tipo_fila

      FROM credit_notes cn
      LEFT JOIN invoices i ON cn.invoice_id = i.id
      LEFT JOIN branches b ON i.branch_id = b.id
      WHERE cn.deleted_at IS NULL
      AND DATE(cn.created_at) >= ?
      AND DATE(cn.created_at) <= ?

      ORDER BY fecha_operacion_raw DESC
    `;

    const [rows] = await connection.execute(query, [
      '2026-01-20',
      '2026-01-23',
      '2026-01-20',
      '2026-01-23'
    ]);

    console.log(`📊 Total de registros encontrados: ${rows.length}\n`);

    // Calcular totales
    let totalFacturas = 0;
    let totalDevoluciones = 0;
    let subtotalTotal = 0;
    let descuentoTotal = 0;
    let impuestoTotal = 0;
    let recargosTotal = 0;
    let totalGeneral = 0;

    rows.forEach(row => {
      if (row.tipo_fila === 'FACTURA') {
        totalFacturas++;
      } else if (row.tipo_fila === 'DEVOLUCION') {
        totalDevoluciones++;
      }

      subtotalTotal += parseFloat(row.subtotal || 0);
      descuentoTotal += parseFloat(row.descuento || 0);
      impuestoTotal += parseFloat(row.impuesto || 0);
      recargosTotal += parseFloat(row.recargos || 0);
      totalGeneral += parseFloat(row.total || 0);
    });

    console.log('='.repeat(80));
    console.log('📊 TOTALES CALCULADOS DESDE LA BASE DE DATOS');
    console.log('='.repeat(80));
    console.log(`Total Facturas:         ${totalFacturas}`);
    console.log(`Total Devoluciones:     ${totalDevoluciones}`);
    console.log(`Total Registros:        ${rows.length}`);
    console.log('');
    console.log(`Subtotal Total:         L ${subtotalTotal.toFixed(2)}`);
    console.log(`Descuento Total:        L ${descuentoTotal.toFixed(2)}`);
    console.log(`Impuesto Total:         L ${impuestoTotal.toFixed(2)}`);
    console.log(`Recargos Total:         L ${recargosTotal.toFixed(2)}`);
    console.log(`TOTAL GENERAL:          L ${totalGeneral.toFixed(2)}`);
    console.log('='.repeat(80));

    console.log('\n📋 COMPARACIÓN:\n');
    console.log(`Base de Datos:          L ${totalGeneral.toFixed(2)}`);
    console.log(`Tu Navegador:           L 132,973.72`);
    console.log(`Diferencia:             L ${(totalGeneral - 132973.72).toFixed(2)}`);

    if (Math.abs(totalGeneral - 132973.72) < 0.01) {
      console.log('\n✅ Los totales coinciden. El navegador está mostrando datos correctos.');
    } else {
      console.log('\n⚠️ Hay una diferencia de L ' + (totalGeneral - 132973.72).toFixed(2));
      console.log('   El servidor está devolviendo: L ' + totalGeneral.toFixed(2));
      console.log('   El navegador está mostrando:  L 132,973.72');
      console.log('\n   Posibles causas:');
      console.log('   1. Caché del navegador (datos viejos)');
      console.log('   2. Filtros diferentes aplicados');
      console.log('   3. Datos modificados después de cargar la página');
    }

    console.log('\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

verifyTotals();
