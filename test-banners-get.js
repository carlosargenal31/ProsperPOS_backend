const axios = require('axios');

// Login primero
axios.post('http://localhost:3000/api/v1/auth/login', {
  email: 'admin@prosperpos.com',
  password: 'admin123'
})
.then(loginRes => {
  const token = loginRes.data.data.token;
  console.log('✓ Login exitoso');

  // Obtener banners
  return axios.get('http://localhost:3000/api/v1/banners', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
})
.then(res => {
  console.log('✓ Banners obtenidos:');
  console.log(JSON.stringify(res.data, null, 2));
})
.catch(err => {
  console.error('✗ ERROR:', err.response?.data || err.message);
  console.error('Status:', err.response?.status);
  process.exit(1);
});
