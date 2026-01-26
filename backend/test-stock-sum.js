const axios = require('axios');

async function testStockSum() {
  try {
    // 1. Login para obtener token
    console.log('1. Iniciando sesión...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@prosperpos.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✓ Token obtenido');

    // 2. Obtener productos con includeStock=true
    console.log('\n2. Obteniendo productos con stock...');
    const productsResponse = await axios.get('http://localhost:3000/api/v1/products', {
      params: {
        page: 1,
        limit: 5,
        includeStock: true
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('\n✓ Productos obtenidos:');
    console.log('Total productos:', productsResponse.data.data.pagination.total);
    console.log('\nPrimeros 5 productos con stock:');
    productsResponse.data.data.products.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id}): Stock = ${product.stock}`);
    });

    // 3. Verificar el producto ID 1 específicamente
    console.log('\n3. Verificando producto ID 1 (debería tener stock 30):');
    const product1 = productsResponse.data.data.products.find(p => p.id === 1);
    if (product1) {
      console.log(`✓ Producto encontrado: ${product1.name}`);
      console.log(`  Stock total: ${product1.stock} (esperado: 30)`);
      if (parseFloat(product1.stock) === 30) {
        console.log('  ✓ ¡Stock correcto! La suma está funcionando.');
      } else {
        console.log('  ✗ Stock incorrecto. Revisar la query.');
      }
    } else {
      console.log('✗ Producto ID 1 no encontrado en la primera página');
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testStockSum();
