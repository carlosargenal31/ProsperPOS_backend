const axios = require('axios');

async function testGoogleOAuth() {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/google-oauth', {
      email: 'test@example.com',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/photo.jpg',
      sub: '123456789'
    });

    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGoogleOAuth();
