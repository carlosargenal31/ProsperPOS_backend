// SCRIPT DE PRUEBA PARA CONSOLA DEL NAVEGADOR
// Copia y pega este código en la consola de Chrome/Firefox en http://localhost:3002

console.log('🧪 Iniciando pruebas de API...\n');

// Test 1: Banners
fetch('http://localhost:3000/api/v1/banners/active')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Test 1: Banners');
    console.log('URL:', 'http://localhost:3000/api/v1/banners/active');
    console.log('Success:', data.success);
    console.log('Banners encontrados:', data.data?.length || 0);
    if (data.data && data.data.length > 0) {
      console.log('Primer banner:', {
        title: data.data[0].title,
        subtitle: data.data[0].subtitle,
        button_text: data.data[0].button_text,
        has_image: !!data.data[0].image_url
      });
    }
    console.log('\n');
  })
  .catch(error => {
    console.error('❌ Error en Test 1 (Banners):', error.message);
    console.log('\n');
  });

// Test 2: Productos Destacados
fetch('http://localhost:3000/api/v1/ecommerce/products/featured?limit=3')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Test 2: Productos Destacados');
    console.log('URL:', 'http://localhost:3000/api/v1/ecommerce/products/featured?limit=3');
    console.log('Success:', data.success);
    console.log('Productos encontrados:', data.data?.length || 0);
    if (data.data && data.data.length > 0) {
      console.log('Primer producto:', {
        id: data.data[0].id,
        name: data.data[0].name,
        price: data.data[0].sale_price
      });
    }
    console.log('\n');
  })
  .catch(error => {
    console.error('❌ Error en Test 2 (Productos):', error.message);
    console.log('\n');
  });

console.log('⏳ Esperando respuestas...\n');
