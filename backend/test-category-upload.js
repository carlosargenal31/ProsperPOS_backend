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

// Crear form data COMO CATEGORIES
const form = new FormData();
form.append('file', pngBuffer, { filename: 'test-category.png', contentType: 'image/png' });
form.append('categoryId', '1');  // ID de categoría existente

console.log('📤 Testing /upload/category endpoint...');

// Hacer request de upload
axios.post('http://localhost:3000/api/v1/upload/category', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': `Bearer ${token}`
  }
})
.then(res => {
  console.log('\n✓✓✓ CATEGORY UPLOAD SUCCESS! ✓✓✓\n');
  console.log(JSON.stringify(res.data, null, 2));
  process.exit(0);
})
.catch(err => {
  console.error('\n✗✗✗ CATEGORY UPLOAD ERROR ✗✗✗\n');
  console.error(JSON.stringify(err.response?.data || { message: err.message }, null, 2));
  process.exit(1);
});
