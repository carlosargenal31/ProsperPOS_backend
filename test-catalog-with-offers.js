const axios = require('axios');

(async () => {
  try {
    // Test catalog endpoint with subcategory 22 filter
    const response = await axios.get('http://localhost:3000/api/v1/ecommerce/products/catalog', {
      params: {
        subcategory_ids: '22',
        limit: 5
      }
    });

    if (response.data.success) {
      const products = response.data.data.products;

      console.log(`\n✅ Obtenidos ${products.length} productos de subcategoría 22:\n`);

      products.forEach(p => {
        console.log(`Producto: ${p.name}`);
        console.log(`  - Código: ${p.code}`);
        console.log(`  - Precio original: L${p.original_price || p.sale_price}`);
        console.log(`  - Precio con oferta: L${p.sale_price}`);
        console.log(`  - Tiene oferta: ${p.has_offer ? 'SÍ ✅' : 'NO ❌'}`);
        if (p.has_offer) {
          console.log(`  - Descuento: L${p.discount_amount}`);
          console.log(`  - Nombre oferta: ${p.offer_name}`);
          console.log(`  - Tipo condición: ${p.offer_condition_type || 'ninguna'}`);
        }
        console.log('');
      });
    } else {
      console.error('❌ Error en respuesta:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
  }
})();
