// ===================================================================
// PROSPERPOS - PROBAR ENDPOINTS DE PRODUCTOS DESTACADOS
// ===================================================================

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testFeaturedProducts() {
  try {
    console.log('='.repeat(60));
    console.log('PRUEBA DE PRODUCTOS DESTACADOS');
    console.log('='.repeat(60));

    // 1. Obtener productos destacados desde e-commerce (público)
    console.log('\n1. Obtener productos destacados (público):');
    const featuredResponse = await axios.get(`${API_URL}/ecommerce/products/featured`);

    console.log(`✓ Status: ${featuredResponse.status}`);
    console.log(`✓ Productos encontrados: ${featuredResponse.data.data.length}`);

    if (featuredResponse.data.data.length > 0) {
      console.log('\nPrimeros 3 productos destacados:');
      featuredResponse.data.data.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (${product.code})`);
        console.log(`     Precio: $${product.sale_price}`);
        console.log(`     Categoría: ${product.category_name}`);
      });
    }

    // 2. Obtener con límite
    console.log('\n2. Obtener productos destacados con límite de 5:');
    const limitedResponse = await axios.get(`${API_URL}/ecommerce/products/featured?limit=5`);
    console.log(`✓ Productos retornados: ${limitedResponse.data.data.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✓ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ Error en las pruebas:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Mensaje: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`  ${error.message}`);
    }
    process.exit(1);
  }
}

// Ejecutar pruebas
testFeaturedProducts()
  .then(() => {
    console.log('\n✓ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error fatal:', error.message);
    process.exit(1);
  });
