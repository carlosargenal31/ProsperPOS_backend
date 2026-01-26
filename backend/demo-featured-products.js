// ===================================================================
// PROSPERPOS - DEMOSTRACIÓN DE PRODUCTOS DESTACADOS
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function demoFeaturedProducts() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'venta_pos'
    });

    console.log('\n' + '='.repeat(70));
    console.log('DEMOSTRACIÓN: PRODUCTOS DESTACADOS PARA TIENDA ONLINE');
    console.log('='.repeat(70) + '\n');

    // Ejecutar la misma query que el endpoint
    const [products] = await connection.query(`
      SELECT
        p.id,
        p.name,
        p.code,
        p.description,
        p.image,
        COALESCE(u.name, 'UND') as unit,
        COALESCE(c.name, '') as category_name,
        COALESCE(b.name, '') as brand_name,
        p.price_1 as sale_price,
        COALESCE(t.rate, 0) as tax_rate,
        0 as stock_available
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN tax_rates t ON p.tax_id = t.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.is_active = 1
        AND p.deleted_at IS NULL
        AND p.is_featured = 1
      ORDER BY p.updated_at DESC
      LIMIT 10
    `);

    console.log(`📦 Total de productos destacados: ${products.length}\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ├─ Código: ${product.code}`);
      console.log(`   ├─ Categoría: ${product.category_name || 'Sin categoría'}`);
      console.log(`   ├─ Marca: ${product.brand_name || 'Sin marca'}`);
      console.log(`   ├─ Precio: $${parseFloat(product.sale_price).toLocaleString('es-CO')}`);
      console.log(`   ├─ IVA: ${product.tax_rate}%`);
      console.log(`   ├─ Unidad: ${product.unit}`);
      console.log(`   └─ Imagen: ${product.image ? '✓ Sí' : '✗ No'}`);
      console.log('');
    });

    // Simular respuesta del API
    const apiResponse = {
      success: true,
      data: products
    };

    console.log('='.repeat(70));
    console.log('RESPUESTA DEL ENDPOINT');
    console.log('='.repeat(70));
    console.log('\nGET /api/v1/ecommerce/products/featured\n');
    console.log(JSON.stringify(apiResponse, null, 2).substring(0, 500) + '...\n');

    console.log('='.repeat(70));
    console.log('ESTADÍSTICAS');
    console.log('='.repeat(70));

    const conImagen = products.filter(p => p.image).length;
    const conCategoria = products.filter(p => p.category_name).length;
    const conMarca = products.filter(p => p.brand_name).length;
    const precioPromedio = products.reduce((sum, p) => sum + parseFloat(p.sale_price), 0) / products.length;

    console.log(`\n✓ Productos con imagen: ${conImagen}/${products.length}`);
    console.log(`✓ Productos con categoría: ${conCategoria}/${products.length}`);
    console.log(`✓ Productos con marca: ${conMarca}/${products.length}`);
    console.log(`✓ Precio promedio: $${precioPromedio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`);

    console.log('\n' + '='.repeat(70));
    console.log('✓ IMPLEMENTACIÓN COMPLETADA Y FUNCIONAL');
    console.log('='.repeat(70) + '\n');

    await connection.end();

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

demoFeaturedProducts();
