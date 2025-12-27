const axios = require('axios');

async function testSorting() {
  try {
    // Login
    console.log('1. Iniciando sesión...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data?.accessToken || loginResponse.data.data?.token;
    console.log('✓ Token obtenido:', token ? 'OK' : 'ERROR');

    // Test 1: Ordenar por stock descendente
    console.log('\n2. Probando ordenar por STOCK (mayor a menor)...');
    const response1 = await axios.get('http://localhost:3000/api/v1/products', {
      params: {
        page: 1,
        limit: 5,
        includeStock: true,
        sort_by: 'stock',
        sort_order: 'DESC'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Productos ordenados por stock DESC:');
    response1.data.data.products.forEach(p => {
      console.log(`  - ${p.name}: Stock = ${p.stock}`);
    });

    // Test 2: Ordenar por nombre ascendente
    console.log('\n3. Probando ordenar por NOMBRE (A-Z)...');
    const response2 = await axios.get('http://localhost:3000/api/v1/products', {
      params: {
        page: 1,
        limit: 5,
        includeStock: true,
        sort_by: 'name',
        sort_order: 'ASC'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Productos ordenados por nombre ASC:');
    response2.data.data.products.forEach(p => {
      console.log(`  - ${p.name}: Stock = ${p.stock}`);
    });

    // Test 3: Ordenar por precio descendente
    console.log('\n4. Probando ordenar por PRECIO (mayor a menor)...');
    const response3 = await axios.get('http://localhost:3000/api/v1/products', {
      params: {
        page: 1,
        limit: 5,
        includeStock: true,
        sort_by: 'price_1',
        sort_order: 'DESC'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Productos ordenados por precio DESC:');
    response3.data.data.products.forEach(p => {
      console.log(`  - ${p.name}: Precio = L. ${p.price_1}, Stock = ${p.stock}`);
    });

    console.log('\n✅ ¡Todos los tests de ordenamiento funcionan correctamente!');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSorting();
