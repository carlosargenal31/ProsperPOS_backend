const mysql = require('mysql2/promise');

async function fixProductSubcategories() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('🔧 Actualizando subcategorías de productos...\n');

    // Obtener todos los productos sin subcategoría
    const [products] = await connection.execute(`
      SELECT id, name, code, category_id, subcategory_id
      FROM products
      WHERE subcategory_id IS NULL AND deleted_at IS NULL
      LIMIT 500
    `);

    console.log(`📦 Productos a procesar: ${products.length}\n`);

    let updated = 0;

    for (const product of products) {
      let subcategoryId = null;
      const name = product.name.toUpperCase();
      const categoryId = product.category_id;

      // Extraer tamaño del nombre
      if (categoryId === 1) { // PORCELANATO
        if (name.includes('60X60') || name.includes('60 X 60')) subcategoryId = 1;
        else if (name.includes('60X120') || name.includes('60 X 120')) subcategoryId = 2;
        else if (name.includes('80X80') || name.includes('80 X 80')) subcategoryId = 3;
        else if (name.includes('90X180') || name.includes('90 X 180')) subcategoryId = 4;
        else if (name.includes('100X100') || name.includes('100 X 100')) subcategoryId = 5;
      } else if (categoryId === 2) { // PAREDES
        if (name.includes('30X45') || name.includes('30 X 45')) subcategoryId = 8;
        else if (name.includes('30X60') || name.includes('30 X 60')) subcategoryId = 9;
        else if (name.includes('25X33') || name.includes('25 X 33')) {
          if (name.includes('BAÑO') || name.includes('BA�O')) subcategoryId = 10;
          else if (name.includes('COCINA')) subcategoryId = 11;
          else subcategoryId = 10; // Default baño
        }
        else if (name.includes('32X57') || name.includes('32 X 57')) subcategoryId = 12;
        else if (name.includes('20X60') || name.includes('20 X 60')) subcategoryId = 13;
        else if (name.includes('30X58') || name.includes('30 X 58')) subcategoryId = 14;
      } else if (categoryId === 4) { // CERAMICAS
        if (name.includes('46X46') || name.includes('46 X 46')) subcategoryId = 22;
        else if (name.includes('45X45') || name.includes('45 X 45')) subcategoryId = 23;
        else if (name.includes('60X60') || name.includes('60 X 60')) subcategoryId = 24;
        else if (name.includes('33X33') || name.includes('33 X 33')) {
          if (name.includes('EXTERIOR')) subcategoryId = 27;
          else subcategoryId = 26; // Default interior
        }
        else if (name.includes('20X60') || name.includes('20 X 60')) subcategoryId = 29;
      }

      if (subcategoryId) {
        await connection.execute(
          'UPDATE products SET subcategory_id = ? WHERE id = ?',
          [subcategoryId, product.id]
        );
        updated++;
        if (updated % 50 === 0) {
          console.log(`✓ Actualizados: ${updated}/${products.length}`);
        }
      }
    }

    console.log(`\n✅ Total actualizado: ${updated} productos`);
    console.log(`⚠️  Sin actualizar: ${products.length - updated} productos (no se pudo determinar tamaño)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

fixProductSubcategories();
