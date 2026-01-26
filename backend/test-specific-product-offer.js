const axios = require('axios');

(async () => {
  try {
    // Test specific product from subcategory 22
    const response = await axios.get('http://localhost:3000/api/v1/ecommerce/products/catalog', {
      params: {
        search: 'C-0001-9',
        limit: 1
      }
    });

    if (response.data.success && response.data.data.products.length > 0) {
      const p = response.data.data.products[0];

      console.log('\n📦 Producto C-0001-9:');
      console.log('  Nombre:', p.name);
      console.log('  Category ID:', p.category_id);
      console.log('  Subcategory ID:', p.subcategory_id);
      console.log('  Precio original:', p.original_price);
      console.log('  Precio de venta:', p.sale_price);
      console.log('  Tiene oferta:', p.has_offer ? 'SÍ ✅' : 'NO ❌');

      if (p.has_offer) {
        console.log('  Descuento:', p.discount_amount);
        console.log('  Nombre oferta:', p.offer_name);
      }
    } else {
      console.error('❌ Producto no encontrado');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
  }
})();
