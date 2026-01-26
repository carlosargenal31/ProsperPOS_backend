// Test search suggestions endpoint
const axios = require('axios');

async function testSearchSuggestions() {
  try {
    console.log('Testing search suggestions...');
    const response = await axios.get('http://localhost:3000/api/v1/ecommerce/search-suggestions', {
      params: { q: 'lava' }
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);

    // Try to get more details from server
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testSearchSuggestions();
