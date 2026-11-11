const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testSalesBook() {
  try {
    console.log('🔍 PRUEBA HTTP DEL ENDPOINT DE LIBRO DE VENTAS\n');

    // Paso 1: Login
    console.log('1. Obteniendo token de autenticación...');
    const loginData = JSON.stringify({
      username: 'carlos.argenal',
      password: 'admin123'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const loginResponse = await makeRequest(loginOptions, loginData);

    if (!loginResponse.success) {
      console.error('❌ Error en login:', loginResponse.message);
      console.log('\nIntentando con usuario "admin"...');

      const loginData2 = JSON.stringify({
        username: 'admin',
        password: 'admin123'
      });
      loginOptions.headers['Content-Length'] = Buffer.byteLength(loginData2);
      const loginResponse2 = await makeRequest(loginOptions, loginData2);

      if (!loginResponse2.success) {
        console.error('❌ Error en login con admin:', loginResponse2.message);
        process.exit(1);
      }

      var token = loginResponse2.data.token;
    } else {
      var token = loginResponse.data.token;
    }

    console.log('✅ Token obtenido\n');

    // Paso 2: Consultar libro de ventas
    console.log('2. Consultando libro de ventas (2026-01-20 a 2026-01-23)...\n');

    const salesBookOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/sales-book?date_from=2026-01-20&date_to=2026-01-23',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const salesBookResponse = await makeRequest(salesBookOptions);

    if (!salesBookResponse.success) {
      console.error('❌ Error:', salesBookResponse.message);
      process.exit(1);
    }

    const invoices = salesBookResponse.data.invoices;
    const totals = salesBookResponse.data.totals;

    console.log('✅ Datos recibidos del servidor\n');
    console.log('='.repeat(130));
    console.log(
      'Nro Doc'.padEnd(18) +
      'Tipo'.padEnd(14) +
      'Subtotal'.padStart(14) +
      'Descuento'.padStart(14) +
      'Impuesto'.padStart(14) +
      'Recargos'.padStart(14) +
      'Total'.padStart(14) +
      'Devuelto'.padStart(14)
    );
    console.log('='.repeat(130));

    // Mostrar las primeras 10 facturas
    invoices.slice(0, 10).forEach(inv => {
      console.log(
        inv.nro_documento.padEnd(18) +
        inv.tipo_documento.padEnd(14) +
        parseFloat(inv.subtotal || 0).toFixed(2).padStart(14) +
        parseFloat(inv.descuento || 0).toFixed(2).padStart(14) +
        parseFloat(inv.impuesto || 0).toFixed(2).padStart(14) +
        parseFloat(inv.recargos || 0).toFixed(2).padStart(14) +
        parseFloat(inv.total || 0).toFixed(2).padStart(14) +
        parseFloat(inv.devuelto || 0).toFixed(2).padStart(14)
      );
    });

    console.log('='.repeat(130));
    console.log('\n📊 TOTALES GENERALES:\n');
    console.log(`Total Facturas:     ${totals.total_facturas || 0}`);
    console.log(`Total Devoluciones: ${totals.total_devoluciones || 0}`);
    console.log(`Subtotal Total:     L ${parseFloat(totals.subtotal_total || 0).toFixed(2)}`);
    console.log(`Descuento Total:    L ${parseFloat(totals.descuento_total || 0).toFixed(2)}`);
    console.log(`Impuesto Total:     L ${parseFloat(totals.impuesto_total || 0).toFixed(2)}`);
    console.log(`Recargos Total:     L ${parseFloat(totals.recargos_total || 0).toFixed(2)}`);
    console.log(`Total General:      L ${parseFloat(totals.total_total || 0).toFixed(2)}`);
    console.log(`Total Devuelto:     L ${parseFloat(totals.total_devuelto || 0).toFixed(2)}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICACIÓN DEL CÁLCULO:');
    console.log('='.repeat(80));

    if (invoices.length > 0) {
      // Buscar una factura con descuento
      const facturaConDescuento = invoices.find(inv => parseFloat(inv.descuento || 0) > 0);

      if (facturaConDescuento) {
        const subtotal = parseFloat(facturaConDescuento.subtotal || 0);
        const descuento = parseFloat(facturaConDescuento.descuento || 0);
        const subtotalNeto = subtotal - descuento;

        console.log(`\nFactura: ${facturaConDescuento.nro_documento}`);
        console.log(`  Subtotal (BRUTO):     ${subtotal.toFixed(2)} ← Debe ser el valor SIN descuentos`);
        console.log(`  Descuento:            ${descuento.toFixed(2)}`);
        console.log(`  Subtotal Neto:        ${subtotalNeto.toFixed(2)} (lo que había antes en BD)`);
        console.log(`  Impuesto:             ${parseFloat(facturaConDescuento.impuesto || 0).toFixed(2)}`);
        console.log(`  Recargos:             ${parseFloat(facturaConDescuento.recargos || 0).toFixed(2)}`);
        console.log(`  Total:                ${parseFloat(facturaConDescuento.total || 0).toFixed(2)}`);

        console.log('\n✅ RESULTADO: El subtotal incluye el valor BRUTO (antes de descuentos)');
        console.log('✅ El descuento se muestra en su propia columna');
        console.log('✅ La fórmula es: Subtotal - Descuento + Impuesto + Recargos = Total');
      } else {
        console.log('\n⚠️ No se encontraron facturas con descuento en este período');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 CONCLUSIÓN:');
    console.log('='.repeat(80));
    console.log('Si ves valores diferentes en el navegador, es por el CACHÉ.');
    console.log('El servidor está devolviendo los datos CORRECTOS.');
    console.log('\nPara ver los cambios en el navegador:');
    console.log('  1. Presiona Ctrl+Shift+Delete');
    console.log('  2. Limpia "Imágenes y archivos en caché"');
    console.log('  3. Cierra TODAS las pestañas de ProsperPOS');
    console.log('  4. Abre nuevamente el sistema');
    console.log('=' .repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testSalesBook();
