const axios = require('axios');

async function testAPI() {
  try {
    // Primero obtener una lista de compras
    console.log('1. Obteniendo lista de compras...');
    const searchResponse = await axios.get('http://localhost:3000/api/v1/purchase-reprint/search', {
      params: {
        documentType: 'COMPRA'
      }
    });

    console.log(`   ✓ Encontradas ${searchResponse.data.data.length} compras`);

    if (searchResponse.data.data.length > 0) {
      const firstPurchase = searchResponse.data.data[0];
      console.log(`   Primera compra: ID=${firstPurchase.id}, Número=${firstPurchase.document_number}`);

      // Ahora obtener los detalles
      console.log('\n2. Obteniendo detalles de la primera compra...');
      const detailsResponse = await axios.get(`http://localhost:3000/api/v1/purchase-reprint/document/COMPRA/${firstPurchase.id}`);

      console.log('   ✓ Detalles obtenidos exitosamente');
      console.log('   Notas:', detailsResponse.data.data.notes || '(sin notas)');
      console.log('   Items:', detailsResponse.data.data.items?.length || 0);
    } else {
      console.log('   ⚠️ No hay compras para probar');
    }

    console.log('\n✅ Test completado exitosamente');
  } catch (error) {
    console.error('\n❌ Error en el test:');
    console.error('   Mensaje:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testAPI();
