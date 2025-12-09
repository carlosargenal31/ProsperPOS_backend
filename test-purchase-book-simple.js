// Test simple del endpoint de libro de compras
const axios = require('axios');

async function testPurchaseBook() {
  try {
    console.log('🔐 1. Iniciando sesión...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@prosperpos.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Sesión iniciada correctamente\n');

    console.log('📋 2. Obteniendo libro de compras...');
    const response = await axios.get('http://localhost:3000/api/v1/purchase-book', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Respuesta recibida:\n');
    console.log('Response structure:', JSON.stringify(response.data, null, 2));

    const data = response.data.data || response.data;
    console.log('\nTotal de registros:', data.totals?.total_registros);
    console.log('Total compras:', response.data.totals.total_compras);
    console.log('Total devoluciones:', response.data.totals.total_devoluciones);
    console.log('Subtotal:', response.data.totals.subtotal_total);
    console.log('ISV:', response.data.totals.isv_total);
    console.log('Total:', response.data.totals.total_total);
    console.log('Total devuelto:', response.data.totals.total_devuelto);

    if (response.data.purchases && response.data.purchases.length > 0) {
      console.log('\n📦 Primeras 3 compras:');
      response.data.purchases.slice(0, 3).forEach((purchase, index) => {
        console.log(`\n${index + 1}. ${purchase.numero_factura}`);
        console.log(`   Fecha: ${purchase.fecha}`);
        console.log(`   Proveedor: ${purchase.proveedor}`);
        console.log(`   RTN: ${purchase.rtn_proveedor}`);
        console.log(`   Total: L ${purchase.total}`);
        console.log(`   Estatus: ${purchase.estatus}`);
      });
    } else {
      console.log('\n⚠️ No hay compras registradas');
    }

    console.log('\n✅ Prueba completada exitosamente');

  } catch (error) {
    console.error('\n❌ Error en la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
      console.error(error.stack);
    }
  }
}

testPurchaseBook();
