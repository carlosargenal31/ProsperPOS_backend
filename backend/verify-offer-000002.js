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

    // Buscar oferta con código 000002
    const [offers] = await conn.execute(
      'SELECT * FROM offers WHERE codigo = ?',
      ['000002']
    );

    if (offers.length === 0) {
      console.log('❌ No se encontró oferta con código 000002');
      await conn.end();
      return;
    }

    const offer = offers[0];
    console.log('\n✅ Oferta encontrada:');
    console.log('  ID:', offer.id);
    console.log('  Código:', offer.codigo);
    console.log('  Nombre:', offer.nombre);
    console.log('  Tipo aplicación:', offer.tipo_aplicacion);
    console.log('  Categoría ID:', offer.categoria_id);
    console.log('  Subcategoría ID:', offer.subcategoria_id);
    console.log('  Tipo descuento:', offer.tipo_descuento);
    console.log('  Valor descuento:', offer.valor_descuento);
    console.log('  Activa:', offer.is_active);

    // Si es tipo grupo, buscar productos de esa categoría/subcategoría
    if (offer.tipo_aplicacion === 'grupo') {
      let query = '';
      let params = [];

      if (offer.subcategoria_id) {
        query = `
          SELECT p.id, p.code, p.name, p.price_1, s.name as subcategory_name
          FROM products p
          LEFT JOIN subcategories s ON p.subcategory_id = s.id
          WHERE p.subcategory_id = ? AND p.is_active = 1
          LIMIT 10
        `;
        params = [offer.subcategoria_id];
        console.log('\n📦 Productos en la subcategoría', offer.subcategoria_id + ':');
      } else if (offer.categoria_id) {
        query = `
          SELECT p.id, p.code, p.name, p.price_1, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.category_id = ? AND p.is_active = 1
          LIMIT 10
        `;
        params = [offer.categoria_id];
        console.log('\n📦 Productos en la categoría', offer.categoria_id + ':');
      }

      const [products] = await conn.execute(query, params);

      if (products.length === 0) {
        console.log('  ⚠️  No se encontraron productos activos');
      } else {
        products.forEach(p => {
          console.log(`  - ${p.code} | ${p.name} | L${p.price_1}`);
        });
        console.log(`\n  Total: ${products.length} productos (mostrando primeros 10)`);
      }
    } else if (offer.tipo_aplicacion === 'multiple') {
      // Buscar items de la oferta
      const [items] = await conn.execute(
        'SELECT * FROM offer_items WHERE offer_id = ?',
        [offer.id]
      );
      console.log('\n📦 Productos en la oferta:');
      if (items.length === 0) {
        console.log('  ⚠️  No hay productos asociados');
      } else {
        items.forEach(item => {
          console.log(`  - Product ID: ${item.product_id} | Code: ${item.product_code} | Descuento: ${item.descuento_porcentaje}%`);
        });
      }
    }

    await conn.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
