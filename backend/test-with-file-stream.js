const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Crear token JWT directamente
const token = jwt.sign(
  { id: 1, email: 'admin@prosperpos.com', role: 'admin' },
  '4321',
  { expiresIn: '1h' }
);

console.log('✓ Token JWT generado');

// Crear un archivo temporal real
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync('/tmp/test-banner.png', pngBuffer);

// Crear form data con archivo real
const form = new FormData();
form.append('file', fs.createReadStream('/tmp/test-banner.png'));
form.append('bannerId', '2');

console.log('📤 Testing with file stream...');

// Hacer request de upload
axios.post('http://localhost:3000/api/v1/upload/banner', form, {
  headers: {
    'Authorization': `Bearer ${token}`,
    ...form.getHeaders()
  }
})
.then(res => {
  console.log('\n✓✓✓ UPLOAD SUCCESS! ✓✓✓\n');
  console.log(JSON.stringify(res.data, null, 2));
  fs.unlinkSync('/tmp/test-banner.png'); // limpiar
  process.exit(0);
})
.catch(err => {
  console.error('\n✗✗✗ ERROR ✗✗✗\n');
  console.error(JSON.stringify(err.response?.data || { message: err.message }, null, 2));
  fs.unlinkSync('/tmp/test-banner.png'); // limpiar
  process.exit(1);
});
