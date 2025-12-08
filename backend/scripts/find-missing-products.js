const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');

async function findMissingProducts() {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(path.join(__dirname, '..', 'productos.xls'));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Total de productos en Excel: ${data.length}`);

    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    // Obtener todos los códigos en la BD
    const [existingProducts] = await connection.execute(
      'SELECT code FROM products'
    );

    const existingCodes = new Set(existingProducts.map(p => p.code));
    console.log(`Total de productos en BD: ${existingCodes.size}`);

    // Encontrar productos faltantes
    const missingProducts = [];

    data.forEach((row, index) => {
      const code = row.CODIGO || row.codigo;
      if (!code) {
        console.log(`Fila ${index + 1} sin código:`, row);
        return;
      }

      if (!existingCodes.has(code)) {
        missingProducts.push({
          excelRow: index + 1,
          code: code,
          name: row.NOMBRE || row.nombre || '',
          data: row
        });
      }
    });

    console.log(`\n=== PRODUCTOS FALTANTES: ${missingProducts.length} ===\n`);

    missingProducts.forEach((mp, idx) => {
      console.log(`${idx + 1}. [Excel fila ${mp.excelRow}] ${mp.code} - ${mp.name}`);
    });

    // Guardar detalles completos para inserción
    if (missingProducts.length > 0) {
      const fs = require('fs');
      fs.writeFileSync(
        path.join(__dirname, 'missing-products.json'),
        JSON.stringify(missingProducts, null, 2)
      );
      console.log('\nDetalles guardados en: scripts/missing-products.json');
    }

    await connection.end();

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

findMissingProducts();
