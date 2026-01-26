require('dotenv').config();
const db = require('./src/utils/database');

async function testUpdateProduct() {
  try {
    console.log('1. Verificando estructura de la tabla products...');
    const columns = await db.query('DESCRIBE products');
    console.log('Columnas de products:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('\n2. Obteniendo producto con ID 1...');
    const product = await db.query('SELECT * FROM products WHERE id = 1 AND deleted_at IS NULL');

    if (product.length === 0) {
      console.log('No se encontró el producto con ID 1');
      process.exit(0);
    }

    console.log('Producto encontrado:', {
      id: product[0].id,
      code: product[0].code,
      name: product[0].name,
      category_id: product[0].category_id,
      subcategory_id: product[0].subcategory_id,
      brand_id: product[0].brand_id
    });

    console.log('\n3. Intentando actualizar el producto...');
    const updateQuery = `
      UPDATE products SET
        code = ?, name = ?, short_name = ?, category_id = ?, subcategory_id = ?,
        brand_id = ?, supplier_id = ?, description = ?, cost = ?, price_1 = ?, price_2 = ?,
        price_3 = ?, price_4 = ?, price_5 = ?, price_6 = ?,
        unit_id = ?, weight = ?, show_in_online_store = ?, is_featured = ?, tax_id = ?,
        is_active = ?,
        color = ?, acabado = ?, estilo = ?,
        updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const updateParams = [
      product[0].code,
      product[0].name,
      product[0].short_name,
      product[0].category_id,
      product[0].subcategory_id,
      product[0].brand_id,
      product[0].supplier_id,
      product[0].description,
      product[0].cost,
      product[0].price_1,
      product[0].price_2,
      product[0].price_3,
      product[0].price_4,
      product[0].price_5,
      product[0].price_6,
      product[0].unit_id,
      product[0].weight,
      product[0].show_in_online_store,
      product[0].is_featured,
      product[0].tax_id,
      product[0].is_active,
      product[0].color,
      product[0].acabado,
      product[0].estilo,
      1, // updated_by
      1  // id
    ];

    console.log('Parámetros de actualización:', updateParams.map((p, i) => `${i}: ${p}`).join('\n  '));

    await db.execute(updateQuery, updateParams);
    console.log('Producto actualizado exitosamente!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testUpdateProduct();
