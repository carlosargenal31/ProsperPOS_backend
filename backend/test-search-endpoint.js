const axios = require('axios');

// Get token first (you'll need to replace with actual credentials)
async function testEndpoint() {
  try {
    // Login first to get token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@prosperpos.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✓ Login successful');

    // Test the search endpoint
    const response = await axios.get('http://localhost:3000/api/v1/products/search/all', {
      params: {
        status: 'active'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n✓ Endpoint works!');
    console.log('Number of products:', response.data.data ? response.data.data.length : 0);

    if (response.data.data && response.data.data.length > 0) {
      const firstProduct = response.data.data[0];
      console.log('\nFirst product:', {
        id: firstProduct.id,
        code: firstProduct.code,
        name: firstProduct.name,
        price_1: firstProduct.price_1,
        stock: firstProduct.stock,
        image: firstProduct.image ? 'Yes' : 'No'
      });
    }

  } catch (error) {
    console.error('\n✗ Error:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testEndpoint();
