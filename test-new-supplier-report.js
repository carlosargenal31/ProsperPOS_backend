require('dotenv').config();
const db = require('./src/utils/database');

async function testNewCalculation() {
  try {
    console.log('=== PROBANDO NUEVO CÁLCULO DEL REPORTE ===\n');

    const query = `
      SELECT
        COALESCE(pd.supplier_name, 'SIN PROVEEDOR') as supplier_name,
        pd.supplier_id_number,
        COUNT(DISTINCT CASE WHEN pd.status != 'Returned' THEN pd.id END) as total_purchases,
        SUM(CASE WHEN pd.status != 'Returned' THEN pd.net_amount ELSE 0 END) as total_neto,
        SUM(CASE WHEN pd.status != 'Returned' THEN pd.tax_amount ELSE 0 END) as total_isv,
        SUM(CASE WHEN pd.status != 'Returned' THEN (pd.net_amount + pd.tax_amount) ELSE 0 END) as total_con_isv,
        SUM(CASE WHEN pd.status = 'Returned' THEN pd.total_amount ELSE 0 END) as devuelto,
        SUM(CASE WHEN pd.status != 'Returned' THEN pd.discount_amount ELSE 0 END) as total_descuento
      FROM purchases_documents pd
      WHERE pd.deleted_at IS NULL
        AND (pd.supplier_name = 'Ferreteria Faraj' OR pd.supplier_name = 'Pegaduro de Centro America SRL')
      GROUP BY pd.supplier_name, pd.supplier_id_number
      ORDER BY total_con_isv DESC
    `;

    const results = await db.query(query);

    console.log('RESULTADOS DEL REPORTE:\n');
    console.table(results);

    // Verificar que los cálculos cuadren
    console.log('\n=== VERIFICACIÓN DE CÁLCULOS ===\n');

    results.forEach(supplier => {
      const neto = parseFloat(supplier.total_neto);
      const isv = parseFloat(supplier.total_isv);
      const totalConIsv = parseFloat(supplier.total_con_isv);
      const calculado = neto + isv;
      const diferencia = Math.abs(totalConIsv - calculado);

      console.log(`${supplier.supplier_name}:`);
      console.log(`  Neto: ${neto.toFixed(2)}`);
      console.log(`  ISV: ${isv.toFixed(2)}`);
      console.log(`  Total+ISV (reportado): ${totalConIsv.toFixed(2)}`);
      console.log(`  Neto + ISV (calculado): ${calculado.toFixed(2)}`);
      console.log(`  Diferencia: ${diferencia.toFixed(2)}`);
      console.log(`  ✓ ${diferencia < 0.01 ? 'CUADRA PERFECTO' : 'NO CUADRA'}`);
      console.log(`  Devuelto: ${parseFloat(supplier.devuelto).toFixed(2)}`);
      console.log(`  Descuentos: ${parseFloat(supplier.total_descuento).toFixed(2)}`);
      console.log(`  Cantidad de compras: ${supplier.total_purchases}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testNewCalculation();
