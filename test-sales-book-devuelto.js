require('dotenv').config();
const db = require('./src/utils/database');

async function testSalesBookDevuelto() {
  try {
    console.log('=== VERIFICANDO COLUMNA DEVUELTO EN LIBRO DE VENTAS ===\n');

    // Probar facturas devueltas
    console.log('1. FACTURAS DEVUELTAS:\n');
    const facturas = await db.query(`
      SELECT
        i.id,
        i.invoice_number as nro_documento,
        i.payment_status as estatus,
        COALESCE(i.total, 0) as total,
        COALESCE(
          (SELECT ABS(SUM(cn.total))
           FROM credit_notes cn
           WHERE cn.invoice_id = i.id
           AND cn.deleted_at IS NULL),
          0
        ) as devuelto
      FROM invoices i
      WHERE i.deleted_at IS NULL
      AND i.payment_status = 'returned'
      LIMIT 3
    `);

    console.table(facturas);

    // Probar notas de crédito
    console.log('\n2. NOTAS DE CRÉDITO (DEVOLUCIONES):\n');
    const devoluciones = await db.query(`
      SELECT
        cn.id,
        CONCAT('NC-', COALESCE(cn.credit_note_number, LPAD(cn.id, 6, '0'))) as nro_documento,
        -COALESCE(cn.total, 0) as total,
        0 as devuelto
      FROM credit_notes cn
      WHERE cn.deleted_at IS NULL
      LIMIT 3
    `);

    console.table(devoluciones);

    console.log('\n=== ANÁLISIS ===\n');

    let totalDevueltoFacturas = 0;
    facturas.forEach(f => {
      totalDevueltoFacturas += parseFloat(f.devuelto || 0);
      console.log(`✓ FACTURA ${f.nro_documento}: Devuelto = ${parseFloat(f.devuelto).toFixed(2)}`);
    });

    let totalDevueltoDevoluciones = 0;
    devoluciones.forEach(d => {
      totalDevueltoDevoluciones += parseFloat(d.devuelto || 0);
      console.log(`✓ NC ${d.nro_documento}: Devuelto = ${parseFloat(d.devuelto).toFixed(2)} (debe ser 0)`);
    });

    console.log('\n=== RESULTADO ===');
    console.log('Total devuelto en FACTURAS:', totalDevueltoFacturas.toFixed(2));
    console.log('Total devuelto en DEVOLUCIONES:', totalDevueltoDevoluciones.toFixed(2));
    console.log('\n' + (totalDevueltoDevoluciones === 0 ? '✓ CORRECTO: Las devoluciones no muestran valor en columna devuelto' : '✗ ERROR: Las devoluciones están duplicando el valor devuelto'));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSalesBookDevuelto();
