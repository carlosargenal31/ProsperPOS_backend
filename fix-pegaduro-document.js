require('dotenv').config();
const db = require('./src/utils/database');

async function fixPegaduro() {
  try {
    console.log('=== CORRIGIENDO DOCUMENTO DE PEGADURO ===\n');

    // Valores correctos manteniendo el total de 3,058.69
    const total = 3058.69;
    const neto = total / 1.15; // 2659.73
    const isv = total - neto;   // 398.96

    console.log('Valores a aplicar:');
    console.log('Total (mantener):', total.toFixed(2));
    console.log('Neto (nuevo):', neto.toFixed(2));
    console.log('ISV 15% (nuevo):', isv.toFixed(2));
    console.log('Verificación:', (neto + isv).toFixed(2), '=', total.toFixed(2), '✓');

    // Actualizar el documento
    const updateQuery = `
      UPDATE purchases_documents
      SET
        net_amount = ?,
        tax_amount = ?
      WHERE supplier_name = 'Pegaduro de Centro America SRL'
        AND purchase_number = 'COM00000001'
        AND deleted_at IS NULL
    `;

    await db.query(updateQuery, [neto.toFixed(2), isv.toFixed(2)]);

    console.log('\n✅ Documento actualizado exitosamente');

    // Verificar el cambio
    const verify = await db.query(`
      SELECT
        purchase_number,
        net_amount,
        tax_amount,
        total_amount,
        (net_amount + tax_amount) as suma_verificacion,
        ((tax_amount / net_amount) * 100) as porcentaje_isv
      FROM purchases_documents
      WHERE supplier_name = 'Pegaduro de Centro America SRL'
        AND deleted_at IS NULL
    `);

    console.log('\n=== VERIFICACIÓN DESPUÉS DEL CAMBIO ===\n');
    console.table(verify);

    if (verify.length > 0) {
      const v = verify[0];
      const suma = parseFloat(v.net_amount) + parseFloat(v.tax_amount);
      const diferencia = Math.abs(suma - parseFloat(v.total_amount));

      console.log('Neto + ISV:', suma.toFixed(2));
      console.log('Total:', parseFloat(v.total_amount).toFixed(2));
      console.log('Diferencia:', diferencia.toFixed(2));
      console.log('Porcentaje ISV:', parseFloat(v.porcentaje_isv).toFixed(2) + '%');
      console.log(diferencia < 0.01 ? '\n✓ CUADRA PERFECTO' : '\n✗ NO CUADRA');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPegaduro();
