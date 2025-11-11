const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');

async function checkMissingProducts() {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(path.join(__dirname, '..', 'productos.xls'));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Total de productos en Excel: ${data.length}`);
    console.log('\nPrimeras 50 filas del Excel:');
    data.slice(0, 50).forEach((row, index) => {
      console.log(`${index + 1}. ${row.CODIGO || row.codigo || 'N/A'} - ${row.NOMBRE || row.nombre || 'N/A'}`);
    });

    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    // Obtener todos los códigos en la BD
    const [existingProducts] = await connection.execute(
      'SELECT code FROM products ORDER BY id'
    );

    const existingCodes = new Set(existingProducts.map(p => p.code));

    console.log(`\nTotal de productos en BD: ${existingCodes.size}`);

    // Encontrar productos faltantes
    const missingProducts = data.filter(row => {
      const code = row.CODIGO || row.codigo;
      return code && !existingCodes.has(code);
    });

    console.log(`\n\nProductos faltantes: ${missingProducts.length}`);
    console.log('\nLista de productos faltantes:');
    missingProducts.forEach((row, index) => {
      console.log(`${index + 1}. ${row.CODIGO || row.codigo} - ${row.NOMBRE || row.nombre}`);
    });

    // Buscar específicamente los códigos del rango mencionado
    console.log('\n\nBuscando rango C-0628-9 al FM-0027-9...');
    const rangeProducts = data.filter(row => {
      const code = row.CODIGO || row.codigo;
      if (!code) return false;

      // Buscar códigos que empiecen con C-06, C-07, etc. hasta FM-00
      return code.match(/^(C-0[6-9]|C-[1-9][0-9]|FM-00)/);
    });

    console.log(`\nProductos en el rango encontrado en Excel: ${rangeProducts.length}`);
    rangeProducts.slice(0, 30).forEach((row, index) => {
      const code = row.CODIGO || row.codigo;
      const exists = existingCodes.has(code);
      console.log(`${index + 1}. ${code} - ${row.NOMBRE || row.nombre} ${exists ? '[EXISTE]' : '[FALTANTE]'}`);
    });

    await connection.end();

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

checkMissingProducts();
