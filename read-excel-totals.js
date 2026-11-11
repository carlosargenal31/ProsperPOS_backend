const XLSX = require('xlsx');

async function readExcelTotals() {
  try {
    const path = 'C:\\Users\\carlo\\OneDrive\\Escritorio\\ProsperPOS\\docs\\libro-ventas-2026-01-20-2026-01-23 (4).xlsx';

    const workbook = XLSX.readFile(path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log('=== DATOS DEL EXCEL ===\n');
    console.log('Total de filas:', data.length);

    // Buscar la fila de totales
    const totalesRow = data.find(row => {
      const tipoDoc = String(row['Tipo Doc'] || '').toUpperCase();
      return tipoDoc.includes('TOTAL');
    });

    if (totalesRow) {
      console.log('\nTOTALES del Excel:');
      console.log(JSON.stringify(totalesRow, null, 2));
    } else {
      console.log('\nNo encontré fila de totales. Mostrando últimas 5 filas:');
      data.slice(-5).forEach((row, i) => {
        console.log(`\nFila ${data.length - 5 + i + 1}:`);
        console.log(JSON.stringify(row, null, 2));
      });
    }

    // Calcular totales manualmente (excluyendo fila TOTALES)
    let totalSubtotal = 0;
    let totalDescuento = 0;
    let totalRecargos = 0;
    let totalImpuesto = 0;
    let totalTotal = 0;
    let totalDevuelto = 0;

    data.forEach(row => {
      const tipoDoc = String(row['Tipo Doc'] || '').toUpperCase();
      if (tipoDoc && !tipoDoc.includes('TOTAL')) {
        totalSubtotal += parseFloat(row.Subtotal || 0);
        totalDescuento += parseFloat(row.Descuento || 0);
        totalRecargos += parseFloat(row.Recargos || 0);
        totalImpuesto += parseFloat(row.Impuesto || 0);
        totalTotal += parseFloat(row.Total || 0);
        totalDevuelto += parseFloat(row.Devuelto || 0);
      }
    });

    console.log('\n=== TOTALES CALCULADOS DEL EXCEL ===');
    console.log('Subtotal:', totalSubtotal.toFixed(2));
    console.log('Descuento:', totalDescuento.toFixed(2));
    console.log('Recargos:', totalRecargos.toFixed(2));
    console.log('Impuesto:', totalImpuesto.toFixed(2));
    console.log('Total:', totalTotal.toFixed(2));
    console.log('Devuelto:', totalDevuelto.toFixed(2));

    // Mostrar algunas devoluciones
    console.log('\n=== DEVOLUCIONES EN EL EXCEL ===');
    const devoluciones = data.filter(row => {
      const tipoDoc = String(row['Tipo Doc'] || '').toUpperCase();
      return tipoDoc.includes('DEVOLUCION') || tipoDoc.includes('DEV-');
    });

    if (devoluciones.length > 0) {
      console.log(`\nEncontradas ${devoluciones.length} devoluciones:`);
      devoluciones.forEach(dev => {
        console.log(`\n${dev['Nro Doc']}:`);
        console.log(`  Subtotal: ${dev.Subtotal}`);
        console.log(`  Descuento: ${dev.Descuento}`);
        console.log(`  Recargos: ${dev.Recargos}`);
        console.log(`  Impuesto: ${dev.Impuesto}`);
        console.log(`  Total: ${dev.Total}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

readExcelTotals();
