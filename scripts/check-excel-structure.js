// Script para ver la estructura del Excel
const XLSX = require('xlsx');
const path = require('path');

async function checkExcel() {
  try {
    console.log('📖 Leyendo archivo Excel...\n');

    const excelPath = path.join(__dirname, '..', 'productos.xls');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const products = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✓ Se encontraron ${products.length} productos\n`);
    console.log('📋 Estructura del primer producto:\n');
    console.log(JSON.stringify(products[0], null, 2));

    console.log('\n📋 Columnas disponibles:\n');
    console.log(Object.keys(products[0]));

    console.log('\n📋 Primeros 3 productos:\n');
    products.slice(0, 3).forEach((p, i) => {
      console.log(`\nProducto ${i + 1}:`);
      console.log(`  Código: ${p.codigo}`);
      console.log(`  Nombre: ${p.nombre}`);
      console.log(`  Categoría: ${p.codigo_categoria}`);
      console.log(`  Subcategoría: ${p.codigo_sub_categoria}`);
      console.log(`  Marca: ${p.codigo_marca}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkExcel();
