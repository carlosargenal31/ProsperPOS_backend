const axios = require('axios');
const FormData = require('form-data');

// Crear un buffer de imagen PNG simple de 1x1 pixel
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// Crear form data
const form = new FormData();
form.append('file', pngBuffer, { filename: 'test-banner.png', contentType: 'image/png' });
form.append('bannerId', '2');

// Obtener token (simular login)
axios.post('http://localhost:3000/api/v1/auth/login', {
  email: 'admin@prosperpos.com',
  password: 'admin123'
})
.then(loginRes => {
  const token = loginRes.data.data.token;
  console.log('✓ Login exitoso, token obtenido');

  // Hacer request de upload
  return axios.post('http://localhost:3000/api/v1/upload/banner', form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${token}`
    }
  });
})
.then(res => {
  console.log('✓ UPLOAD SUCCESS:');
  console.log(JSON.stringify(res.data, null, 2));
})
.catch(err => {
  console.error('✗ ERROR:', err.response?.data || err.message);
  process.exit(1);
});
