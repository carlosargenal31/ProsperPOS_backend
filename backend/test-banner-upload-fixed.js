const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');

// Crear token JWT directamente (simula un usuario autenticado)
const token = jwt.sign(
  { id: 1, email: 'admin@prosperpos.com', role: 'admin' },
  process.env.JWT_SECRET || 'prosperpos-secret-key-2024',
  { expiresIn: '1h' }
);

console.log('✓ Token JWT generado');

// Crear un buffer de imagen PNG simple de 1x1 pixel
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// Crear form data
const form = new FormData();
form.append('file', pngBuffer, { filename: 'test-banner.png', contentType: 'image/png' });
form.append('bannerId', '2');

// Hacer request de upload
axios.post('http://localhost:3000/api/v1/upload/banner', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': `Bearer ${token}`
  }
})
.then(res => {
  console.log('✓ UPLOAD SUCCESS:');
  console.log(JSON.stringify(res.data, null, 2));
  process.exit(0);
})
.catch(err => {
  console.error('✗ ERROR:', err.response?.data || err.message);
  process.exit(1);
});
