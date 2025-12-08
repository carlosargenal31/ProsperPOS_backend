const XLSX = require('xlsx');
const mysql = require('mysql2/promise');

async function updateProductsBrandsSubcategories() {
  // Conectar a la base de datos
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos',
    charset: 'utf8mb4'
  });

  console.log('✅ Conectado a la base de datos');

  // Leer productos del Excel
  const wb = XLSX.readFile('productos 1.xls');
  const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log(`📦 Total productos en Excel: ${data.length}`);

  // ====================
  // 1. CREAR MARCAS
  // ====================
  const marcasDetectadas = new Set();
  const palabrasClave = ['MENORCA', 'SEVILLA', 'LISBOA', 'OPORTO', 'BALEARES', 'LONDRES', 'TOLEDO', 'BURGOS', 'CALACATTA', 'CRETA', 'ANDRIA', 'PERLA', 'TRENTO', 'ASPEN', 'NIVAL', 'CASTELLON', 'RIBAZO', 'TARSO'];

  data.forEach(p => {
    const nombre = p.nombre.toUpperCase();
    palabrasClave.forEach(palabra => {
      if (nombre.includes(palabra)) {
        marcasDetectadas.add(palabra);
      }
    });
  });

  console.log(`\n🏷️  Marcas detectadas: ${marcasDetectadas.size}`);

  const brandMap = {};
  for (const marca of marcasDetectadas) {
    try {
      const [existing] = await connection.execute('SELECT id FROM brands WHERE name = ?', [marca]);
      if (existing.length > 0) {
        brandMap[marca] = existing[0].id;
        console.log(`   ✓ ${marca} (ya existe, ID: ${existing[0].id})`);
      } else {
        const [result] = await connection.execute(
          'INSERT INTO brands (name, is_active) VALUES (?, 1)',
          [marca]
        );
        brandMap[marca] = result.insertId;
        console.log(`   ✓ ${marca} (creada, ID: ${result.insertId})`);
      }
    } catch (error) {
      console.error(`   ✗ Error con marca ${marca}:`, error.message);
    }
  }

  // ====================
  // 2. CREAR SUBCATEGORÍAS POR TAMAÑO
  // ====================
  const tamañosDetectados = new Set();
  data.forEach(p => {
    const match = p.nombre.toUpperCase().match(/(\d+X\d+CM)/);
    if (match) {
      tamañosDetectados.add(match[1]);
    }
  });

  console.log(`\n📏 Tamaños detectados: ${tamañosDetectados.size}`);

  // Obtener la categoría "PAREDES" (asumiendo que existe, o crear una genérica)
  const [categoriaParedes] = await connection.execute(
    'SELECT id FROM categories WHERE name LIKE "%PARED%" OR name LIKE "%CERAMICA%" LIMIT 1'
  );
  const categoryId = categoriaParedes.length > 0 ? categoriaParedes[0].id : 17; // ID de categoría por defecto

  const subcategoryMap = {};
  for (const tamaño of tamañosDetectados) {
    try {
      const nombre = `Cerámicas ${tamaño}`;
      const [existing] = await connection.execute('SELECT id FROM subcategories WHERE name = ?', [nombre]);
      if (existing.length > 0) {
        subcategoryMap[tamaño] = existing[0].id;
        console.log(`   ✓ ${nombre} (ya existe, ID: ${existing[0].id})`);
      } else {
        const [result] = await connection.execute(
          'INSERT INTO subcategories (name, category_id, is_active) VALUES (?, ?, 1)',
          [nombre, categoryId]
        );
        subcategoryMap[tamaño] = result.insertId;
        console.log(`   ✓ ${nombre} (creada, ID: ${result.insertId})`);
      }
    } catch (error) {
      console.error(`   ✗ Error con subcategoría ${tamaño}:`, error.message);
    }
  }

  // ====================
  // 3. ACTUALIZAR PRODUCTOS
  // ====================
  console.log(`\n🔄 Actualizando productos...`);

  let updated = 0;
  for (const producto of data) {
    try {
      const nombre = producto.nombre.toUpperCase();

      // Detectar marca
      let brandId = null;
      for (const [marca, id] of Object.entries(brandMap)) {
        if (nombre.includes(marca)) {
          brandId = id;
          break;
        }
      }

      // Detectar subcategoría por tamaño
      let subcategoryId = null;
      const matchTamaño = nombre.match(/(\d+X\d+CM)/);
      if (matchTamaño && subcategoryMap[matchTamaño[1]]) {
        subcategoryId = subcategoryMap[matchTamaño[1]];
      }

      // Actualizar producto si tiene marca o subcategoría
      if (brandId || subcategoryId) {
        const updateFields = [];
        const updateValues = [];

        if (brandId) {
          updateFields.push('brand_id = ?');
          updateValues.push(brandId);
        }
        if (subcategoryId) {
          updateFields.push('subcategory_id = ?');
          updateValues.push(subcategoryId);
        }

        updateValues.push(producto.codigo);

        await connection.execute(
          `UPDATE products SET ${updateFields.join(', ')} WHERE code = ?`,
          updateValues
        );
        updated++;
      }
    } catch (error) {
      console.error(`   ✗ Error actualizando producto ${producto.codigo}:`, error.message);
    }
  }

  console.log(`\n✅ Productos actualizados: ${updated}/${data.length}`);

  // Verificar resultados
  const [stats] = await connection.execute(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN brand_id IS NOT NULL THEN 1 ELSE 0 END) as con_marca,
      SUM(CASE WHEN subcategory_id IS NOT NULL THEN 1 ELSE 0 END) as con_subcategoria
    FROM products
  `);

  console.log('\n📊 Estadísticas finales:');
  console.log(`   Total productos: ${stats[0].total}`);
  console.log(`   Con marca: ${stats[0].con_marca}`);
  console.log(`   Con subcategoría: ${stats[0].con_subcategoria}`);

  await connection.end();
  console.log('\n✅ Proceso completado');
}

updateProductsBrandsSubcategories().catch(console.error);
