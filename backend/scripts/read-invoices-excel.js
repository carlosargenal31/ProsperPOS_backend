// ===================================================================
// SCRIPT PARA LEER FACTURAS DESDE EXCEL
// ===================================================================

const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '../Facturas ventas.xls');

try {
  // Leer el archivo Excel
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertir a JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log('===== DATOS DE FACTURAS =====');
  console.log(JSON.stringify(data, null, 2));
  console.log(`\nTotal de registros: ${data.length}`);

  // Mostrar las primeras 5 filas como ejemplo
  console.log('\n===== PRIMEROS 5 REGISTROS =====');
  data.slice(0, 5).forEach((row, index) => {
    console.log(`\nRegistro ${index + 1}:`);
    console.log(row);
  });

} catch (error) {
  console.error('Error al leer el archivo Excel:', error.message);
}
