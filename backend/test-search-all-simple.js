const axios = require('axios');

async function test() {
  try {
    console.log('Probando endpoint sin autenticación...');
    const response = await axios.get('http://localhost:3000/api/v1/products/search/all?status=active');
    console.log('✓ Funciona!');
    console.log('Productos encontrados:', response.data.data ? response.data.data.length : 0);

    if (response.data.data && response.data.data.length > 0) {
      const sample = response.data.data[0];
      console.log('\nEjemplo de producto:');
      console.log('- ID:', sample.id);
      console.log('- Código:', sample.code);
      console.log('- Nombre:', sample.name);
      console.log('- Precio 1:', sample.price_1);
      console.log('- Stock:', sample.stock);
      console.log('- Imagen:', sample.image ? 'Sí' : 'No');
    }
  } catch (error) {
    if (error.response) {
      console.error('✗ Error HTTP:', error.response.status);
      console.error('Mensaje:', error.response.data);
    } else {
      console.error('✗ Error:', error.message);
    }
  }
}

test();
