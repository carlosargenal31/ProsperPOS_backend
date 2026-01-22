const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '310104',
  database: 'prosperpos'
};

(async () => {
  try {
    const conn = await mysql.createConnection(config);

    // Get product info
    const [products] = await conn.execute(
      'SELECT id, code, name, category_id, subcategory_id FROM products WHERE code = ?',
      ['C-0001-9']
    );

    if (products.length === 0) {
      console.log('❌ Product not found');
      await conn.end();
      return;
    }

    const product = products[0];
    console.log('\n📦 Product Info:');
    console.log('  ID:', product.id);
    console.log('  Code:', product.code);
    console.log('  subcategory_id:', product.subcategory_id);
    console.log('  category_id:', product.category_id);

    // Get offer info
    const [offers] = await conn.execute(
      'SELECT id, codigo, nombre, subcategoria_id, categoria_id FROM offers WHERE codigo = ?',
      ['000002']
    );

    if (offers.length === 0) {
      console.log('❌ Offer not found');
      await conn.end();
      return;
    }

    const offer = offers[0];
    console.log('\n🎁 Offer Info:');
    console.log('  ID:', offer.id);
    console.log('  Código:', offer.codigo);
    console.log('  subcategoria_id:', offer.subcategoria_id);
    console.log('  categoria_id:', offer.categoria_id);

    console.log('\n🔍 Comparison:');
    console.log('  Product subcategory_id:', product.subcategory_id, '(type:', typeof product.subcategory_id + ')');
    console.log('  Offer subcategoria_id:', offer.subcategoria_id, '(type:', typeof offer.subcategoria_id + ')');
    console.log('  Match?', product.subcategory_id === offer.subcategoria_id ? '✅ YES' : '❌ NO');
    console.log('  Match with == ?', product.subcategory_id == offer.subcategoria_id ? '✅ YES' : '❌ NO');

    await conn.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
