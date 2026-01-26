const axios = require('axios');

async function testSalesBook() {
  try {
    // Primero obtener un token válido
    console.log('🔑 Obteniendo token...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Token obtenido exitosamente\n');

    // Consultar el libro de ventas del 20-23 de enero
    console.log('📊 Consultando libro de ventas (2026-01-20 a 2026-01-23)...\n');
    const response = await axios.get('http://localhost:3000/api/v1/sales-book', {
      params: {
        date_from: '2026-01-20',
        date_to: '2026-01-23'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const invoices = response.data.data.invoices;
      const totals = response.data.data.totals;

      console.log('✅ Datos del libro de ventas:\n');
      console.log(`📝 Total de registros: ${invoices.length}\n`);

      // Mostrar las primeras 5 facturas con detalles
      console.log('📋 PRIMERAS 5 FACTURAS:\n');
      console.log('=' .repeat(120));
      console.log(
        'Nro Doc'.padEnd(15) +
        'Tipo'.padEnd(12) +
        'Subtotal'.padStart(12) +
        'Descuento'.padStart(12) +
        'Impuesto'.padStart(12) +
        'Recargos'.padStart(12) +
        'Total'.padStart(12) +
        'Devuelto'.padStart(12)
      );
      console.log('=' .repeat(120));

      invoices.slice(0, 5).forEach(inv => {
        console.log(
          inv.nro_documento.padEnd(15) +
          inv.tipo_documento.padEnd(12) +
          parseFloat(inv.subtotal || 0).toFixed(2).padStart(12) +
          parseFloat(inv.descuento || 0).toFixed(2).padStart(12) +
          parseFloat(inv.impuesto || 0).toFixed(2).padStart(12) +
          parseFloat(inv.recargos || 0).toFixed(2).padStart(12) +
          parseFloat(inv.total || 0).toFixed(2).padStart(12) +
          parseFloat(inv.devuelto || 0).toFixed(2).padStart(12)
        );
      });

      console.log('=' .repeat(120));
      console.log('\n📊 TOTALES GENERALES:\n');
      console.log(`Subtotal Total:    L ${parseFloat(totals.subtotal_total || 0).toFixed(2)}`);
      console.log(`Descuento Total:   L ${parseFloat(totals.descuento_total || 0).toFixed(2)}`);
      console.log(`Impuesto Total:    L ${parseFloat(totals.impuesto_total || 0).toFixed(2)}`);
      console.log(`Recargos Total:    L ${parseFloat(totals.recargos_total || 0).toFixed(2)}`);
      console.log(`Total General:     L ${parseFloat(totals.total_total || 0).toFixed(2)}`);
      console.log(`Total Devuelto:    L ${parseFloat(totals.total_devuelto || 0).toFixed(2)}`);

      console.log('\n✅ VERIFICACIÓN:');
      console.log('El subtotal debe ser el valor BRUTO (sin descuentos)');
      console.log('El descuento debe estar en su propia columna');
      console.log('Si ves un subtotal de 8,315.40 debería cambiar a aproximadamente 8,713.00');

    } else {
      console.error('❌ Error en la respuesta:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testSalesBook();
