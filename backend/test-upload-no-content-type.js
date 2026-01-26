const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');

// Crear token JWT directamente
const token = jwt.sign(
  { id: 1, email: 'admin@prosperpos.com', role: 'admin' },
  '4321',
  { expiresIn: '1h' }
);

console.log('✓ Token JWT generado');

// Crear un buffer de imagen PNG simple de 1x1 pixel
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// Crear form data
const form = new FormData();
form.append('file', pngBuffer, { filename: 'test-banner.png', contentType: 'image/png' });
form.append('bannerId', '2');

console.log('📤 Testing without manual Content-Type header...');

// Hacer request de upload - SIN especificar Content-Type manualmente
axios.post('http://localhost:3000/api/v1/upload/banner', form, {
  headers: {
    'Authorization': `Bearer ${token}`,
    ...form.getHeaders()  // Esto incluye Content-Type con boundary correcto
  }
})
.then(res => {
  console.log('\n✓✓✓ UPLOAD SUCCESS! ✓✓✓\n');
  console.log(JSON.stringify(res.data, null, 2));
  process.exit(0);
})
.catch(err => {
  console.error('\n✗✗✗ ERROR ✗✗✗\n');
  console.error(JSON.stringify(err.response?.data || { message: err.message }, null, 2));
  process.exit(1);
});
