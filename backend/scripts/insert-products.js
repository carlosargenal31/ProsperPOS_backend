// Script para insertar productos desde Excel
const XLSX = require('xlsx');
const db = require('../src/utils/database');
const path = require('path');

async function insertProducts() {
  try {
    await db.connectDatabase();

    console.log('📖 Leyendo archivo Excel...\n');

    // Leer el archivo Excel
    const excelPath = path.join(__dirname, '..', 'productos.xls');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON e invertir el orden
    const products = XLSX.utils.sheet_to_json(worksheet).reverse();

    console.log(`✓ Se encontraron ${products.length} productos en el Excel (orden invertido)\n`);

    // Mapeo de códigos de categoría a IDs
    const categoryMap = {
      '001': 1,   // PORCELANATO
      '002': 2,   // AZULEJO
      '003': 3,   // CERAMICA
      '004': 4,   // CERAMICA DE PISO
      '005': 5,   // ENCHAPE
      '006': 6,   // PISOS
      '007': 7,   // SANITARIOS
      '008': 8,   // GRIFERIAS
      '009': 9,   // ACCESORIOS DE BAÑOS
      '010': 10,  // MUEBLES
      '011': 11,  // MUEBLES DE BAÑO
      '012': 12,  // PEGAMENTOS
      '013': 13,  // HERRAMIENTAS
      '014': 14,  // PINTURAS
      '015': 15,  // ILUMINACION
      '016': 16,  // PISOS LAMINADOS
      '017': 17,  // ALFOMBRAS
      '018': 18,  // PANELES DECORATIVOS
      '019': 19,  // VIDRIOS
      '020': 20,  // MATERIALES DE CONSTRUCCION
      '021': 21,  // ELECTRICIDAD
      '022': 22,  // PLOMERIA
      '023': 23,  // FERRETERIA
      '024': 24   // PISOS VINILICOS
    };

    // Limpiar tabla products (eliminar productos existentes)
    console.log('🗑️  Limpiando tabla products...');
    await db.execute('DELETE FROM products');
    await db.execute('ALTER TABLE products AUTO_INCREMENT = 1');
    console.log('✓ Tabla limpiada\n');

    // Insertar productos
    console.log('💾 Insertando productos...\n');

    let inserted = 0;
    let errors = 0;

    for (const product of products) {
      try {
        // Mapear el código de categoría a ID
        const categoryId = categoryMap[product.codigo_categoria] || null;

        const insertQuery = `
          INSERT INTO products (
            code, name, short_name, category_id, subcategory_id, brand_id,
            description, cost, price_1, price_2, price_3, price_4, price_5, price_6,
            stock, fractional, tax_rate, is_active, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await db.execute(insertQuery, [
          product.codigo || null,
          product.nombre || '',
          product.nombre_corto || null,
          categoryId,
          null, // subcategory_id - no hay en el Excel
          null, // brand_id - no hay en el Excel
          null, // description - no hay en el Excel
          parseFloat(product.costo) || 0,
          parseFloat(product.precio_1) || 0,
          parseFloat(product.precio_2) || 0,
          parseFloat(product.precio_3) || 0,
          parseFloat(product.precio_4) || 0,
          parseFloat(product.precio_5) || 0,
          parseFloat(product.precio_6) || 0,
          0, // stock inicial = 0
          parseInt(product.fraccionable) || 0,
          0, // tax_rate
          1, // is_active = 1 (todos activos por defecto)
          1  // created_by = 1 (usuario admin)
        ]);

        inserted++;
        if (inserted % 100 === 0) {
          console.log(`  ✓ ${inserted} productos insertados...`);
        }
      } catch (err) {
        errors++;
        if (errors === 1) {
          console.error(`  ✗ Error insertando producto "${product.nombre}":`);
          console.error(`     Mensaje: ${err.message}`);
          console.error(`     SQL State: ${err.sqlState}`);
          console.error(`     SQL Message: ${err.sqlMessage}`);
        }
      }
    }

    console.log('\n✅ Proceso completado');
    console.log(`   - Productos insertados: ${inserted}`);
    console.log(`   - Errores: ${errors}`);

    await db.closeDatabase();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

insertProducts();
