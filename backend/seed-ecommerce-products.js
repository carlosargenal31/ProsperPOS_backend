const mysql = require('mysql2/promise');

async function seedProducts() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('✓ Conectado a la base de datos');

    // Verificar si ya hay productos
    const [existingProducts] = await connection.query('SELECT COUNT(*) as count FROM products');

    if (existingProducts[0].count > 0) {
      console.log(`✓ Ya existen ${existingProducts[0].count} productos en la base de datos`);

      // Asegurar que los productos tengan precios
      console.log('\n📝 Verificando precios de productos...');

      const [productsWithoutPrices] = await connection.query(`
        SELECT p.id, p.name
        FROM products p
        LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.price_type = 'sale'
        WHERE pp.id IS NULL AND p.deleted_at IS NULL
        LIMIT 10
      `);

      if (productsWithoutPrices.length > 0) {
        console.log(`\n⚠️ Encontrados ${productsWithoutPrices.length} productos sin precio de venta`);
        console.log('Agregando precios...');

        for (const product of productsWithoutPrices) {
          const salePrice = Math.floor(Math.random() * 900) + 100; // Precio entre 100 y 1000

          await connection.query(`
            INSERT INTO product_prices (product_id, store_id, price_type, price, created_at)
            VALUES (?, 1, 'sale', ?, NOW())
          `, [product.id, salePrice]);

          console.log(`  ✓ ${product.name}: L${salePrice}`);
        }
      }

      console.log('\n✅ Los productos existentes están listos para el e-commerce');
      return;
    }

    console.log('\n📦 No hay productos. Creando productos de ejemplo...');

    // Verificar categorías
    const [categories] = await connection.query('SELECT id, name FROM categories WHERE deleted_at IS NULL LIMIT 1');
    const categoryId = categories.length > 0 ? categories[0].id : 1;

    // Verificar marcas
    const [brands] = await connection.query('SELECT id, name FROM brands WHERE deleted_at IS NULL LIMIT 1');
    const brandId = brands.length > 0 ? brands[0].id : null;

    // Productos de ejemplo
    const sampleProducts = [
      { name: 'Laptop Dell Inspiron 15', price: 12500, description: 'Laptop potente para trabajo y estudio' },
      { name: 'Mouse Inalámbrico Logitech', price: 350, description: 'Mouse ergonómico con batería de larga duración' },
      { name: 'Teclado Mecánico RGB', price: 890, description: 'Teclado mecánico con retroiluminación RGB' },
      { name: 'Monitor LG 24 pulgadas', price: 2500, description: 'Monitor Full HD con tecnología IPS' },
      { name: 'Auriculares Bluetooth', price: 650, description: 'Auriculares inalámbricos con cancelación de ruido' },
      { name: 'Webcam HD 1080p', price: 450, description: 'Cámara web para videollamadas en alta definición' },
      { name: 'SSD 500GB Samsung', price: 980, description: 'Disco sólido de alta velocidad' },
      { name: 'Router WiFi 6', price: 1200, description: 'Router de última generación' },
      { name: 'Impresora HP Multifuncional', price: 1850, description: 'Impresora, scanner y copiadora' },
      { name: 'Memoria RAM 16GB', price: 780, description: 'Memoria DDR4 de alto rendimiento' }
    ];

    console.log('\n📦 Creando productos...');

    for (const product of sampleProducts) {
      // Insertar producto
      const [result] = await connection.query(`
        INSERT INTO products (
          name, description, category_id, brand_id, unit, status,
          min_stock, max_stock, created_at
        ) VALUES (?, ?, ?, ?, 'pieza', 'active', 5, 100, NOW())
      `, [product.name, product.description, categoryId, brandId]);

      const productId = result.insertId;

      // Insertar precio
      await connection.query(`
        INSERT INTO product_prices (product_id, store_id, price_type, price, created_at)
        VALUES (?, 1, 'sale', ?, NOW())
      `, [productId, product.price]);

      // Insertar stock inicial
      await connection.query(`
        INSERT INTO stock (product_id, store_id, quantity, created_at)
        VALUES (?, 1, ?, NOW())
      `, [productId, Math.floor(Math.random() * 50) + 10]);

      console.log(`  ✓ ${product.name} - L${product.price}`);
    }

    console.log('\n✅ Productos de ejemplo creados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`  - ${sampleProducts.length} productos creados`);
    console.log('  - Precios asignados');
    console.log('  - Stock inicial agregado');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedProducts();
