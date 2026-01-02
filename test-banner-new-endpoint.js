const axios = require('axios');
const FormData = require('form-data');

// Crear un buffer de imagen PNG simple de 1x1 pixel
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// Obtener token (simular login)
axios.post('http://localhost:3000/api/v1/auth/login', {
  email: 'admin@prosperpos.com',
  password: 'admin123'
})
.then(loginRes => {
  const token = loginRes.data.data.token;
  console.log('✓ Login exitoso, token obtenido');

  // Crear form data - USANDO EL NUEVO PATRÓN DE BRANDS
  const form = new FormData();
  form.append('image', pngBuffer, { filename: 'test-banner.png', contentType: 'image/png' });
  // NO incluir bannerId en el body, va en la URL

  // Hacer request de upload al NUEVO ENDPOINT
  return axios.post('http://localhost:3000/api/v1/banners/1/image', form, {
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
  console.error('Status:', err.response?.status);
  process.exit(1);
});
