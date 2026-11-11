require('dotenv').config();
const db = require('./src/utils/database');

async function checkSuppliers() {
  try {
    console.log('=== VERIFICANDO PROVEEDORES ===\n');

    // Pegaduro
    console.log('1. PEGADURO DE CENTRO AMERICA SRL:');
    const pegaduro = await db.query(`
      SELECT
        purchase_number,
        net_amount,
        tax_amount,
        discount_amount,
        surcharge_amount,
        total_amount,
        (net_amount + tax_amount) as calculated_total,
        (total_amount - (net_amount + tax_amount)) as difference,
        status
      FROM purchases_documents
      WHERE supplier_name = 'Pegaduro de Centro America SRL'
        AND deleted_at IS NULL
    `);

    console.table(pegaduro);

    let pegTotals = {
      net: 0, tax: 0, total: 0, devuelto: 0, discount: 0, surcharge: 0
    };

    pegaduro.forEach(p => {
      if (p.status !== 'Returned') {
        pegTotals.net += parseFloat(p.net_amount || 0);
        pegTotals.tax += parseFloat(p.tax_amount || 0);
        pegTotals.total += parseFloat(p.total_amount || 0);
        pegTotals.discount += parseFloat(p.discount_amount || 0);
        pegTotals.surcharge += parseFloat(p.surcharge_amount || 0);
      } else {
        pegTotals.devuelto += parseFloat(p.total_amount || 0);
      }
    });

    console.log('\nTOTALES PEGADURO:');
    console.log('Neto:', pegTotals.net.toFixed(2));
    console.log('ISV:', pegTotals.tax.toFixed(2));
    console.log('Total:', pegTotals.total.toFixed(2));
    console.log('Descuentos:', pegTotals.discount.toFixed(2));
    console.log('Recargos:', pegTotals.surcharge.toFixed(2));
    console.log('Devuelto:', pegTotals.devuelto.toFixed(2));
    console.log('Neto + ISV =', (pegTotals.net + pegTotals.tax).toFixed(2));
    console.log('Diferencia:', (pegTotals.total - (pegTotals.net + pegTotals.tax)).toFixed(2));

    console.log('\n' + '='.repeat(80) + '\n');

    // Ferreteria Faraj
    console.log('2. FERRETERIA FARAJ:');
    const faraj = await db.query(`
      SELECT
        purchase_number,
        net_amount,
        tax_amount,
        discount_amount,
        surcharge_amount,
        total_amount,
        (net_amount + tax_amount) as calculated_total,
        (total_amount - (net_amount + tax_amount)) as difference,
        status
      FROM purchases_documents
      WHERE supplier_name = 'Ferreteria Faraj'
        AND deleted_at IS NULL
    `);

    console.table(faraj);

    let farTotals = {
      net: 0, tax: 0, total: 0, devuelto: 0, discount: 0, surcharge: 0
    };

    faraj.forEach(p => {
      if (p.status !== 'Returned') {
        farTotals.net += parseFloat(p.net_amount || 0);
        farTotals.tax += parseFloat(p.tax_amount || 0);
        farTotals.total += parseFloat(p.total_amount || 0);
        farTotals.discount += parseFloat(p.discount_amount || 0);
        farTotals.surcharge += parseFloat(p.surcharge_amount || 0);
      } else {
        farTotals.devuelto += parseFloat(p.total_amount || 0);
      }
    });

    console.log('\nTOTALES FERRETERIA FARAJ:');
    console.log('Neto:', farTotals.net.toFixed(2));
    console.log('ISV:', farTotals.tax.toFixed(2));
    console.log('Total:', farTotals.total.toFixed(2));
    console.log('Descuentos:', farTotals.discount.toFixed(2));
    console.log('Recargos:', farTotals.surcharge.toFixed(2));
    console.log('Devuelto:', farTotals.devuelto.toFixed(2));
    console.log('Neto + ISV =', (farTotals.net + farTotals.tax).toFixed(2));
    console.log('Diferencia:', (farTotals.total - (farTotals.net + farTotals.tax)).toFixed(2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSuppliers();
