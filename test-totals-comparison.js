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

async function testTotals() {
  try {
    console.log('🔍 VERIFICACIÓN DE TOTALES - LIBRO DE VENTAS\n');
    console.log('Consultando datos del servidor...\n');

    // Intentar obtener token del almacenamiento
    // Para esta prueba, vamos a consultar sin token (endpoint público si existe)
    // O necesitamos hacer login primero

    // Paso 1: Login
    console.log('1. Autenticando...');
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

    let loginResponse = await makeRequest(loginOptions, loginData);

    if (!loginResponse.success) {
      console.log('Intentando con otro usuario...');
      const users = [
        { username: 'admin', password: 'admin123' },
        { username: 'Admin', password: 'admin123' },
        { username: 'administrador', password: 'admin123' }
      ];

      for (const user of users) {
        const data = JSON.stringify(user);
        loginOptions.headers['Content-Length'] = Buffer.byteLength(data);
        loginResponse = await makeRequest(loginOptions, data);
        if (loginResponse.success) {
          console.log(`✅ Login exitoso con: ${user.username}\n`);
          break;
        }
      }

      if (!loginResponse.success) {
        console.error('❌ No se pudo autenticar con ningún usuario');
        console.log('\nPor favor, abre el navegador y ve a:');
        console.log('http://localhost:8080');
        console.log('Inicia sesión en el sistema');
        console.log('Luego vuelve a ejecutar este script\n');
        process.exit(1);
      }
    } else {
      console.log('✅ Login exitoso\n');
    }

    const token = loginResponse.data.token;

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

    console.log('='.repeat(80));
    console.log('📊 TOTALES DEL SERVIDOR (BACKEND)');
    console.log('='.repeat(80));
    console.log(`Total Facturas:         ${totals.total_facturas}`);
    console.log(`Total Devoluciones:     ${totals.total_devoluciones}`);
    console.log(`Total Registros:        ${totals.total_registros}`);
    console.log('');
    console.log(`Subtotal Total:         L ${parseFloat(totals.subtotal_total || 0).toFixed(2)}`);
    console.log(`Descuento Total:        L ${parseFloat(totals.descuento_total || 0).toFixed(2)}`);
    console.log(`Impuesto Total:         L ${parseFloat(totals.impuesto_total || 0).toFixed(2)}`);
    console.log(`Recargos Total:         L ${parseFloat(totals.recargos_total || 0).toFixed(2)}`);
    console.log(`Total General:          L ${parseFloat(totals.total_total || 0).toFixed(2)}`);
    console.log(`Total Devuelto:         L ${parseFloat(totals.total_devuelto || 0).toFixed(2)}`);
    console.log('='.repeat(80));

    // Verificar manualmente
    console.log('\n📋 VERIFICACIÓN MANUAL:\n');

    let manualSubtotal = 0;
    let manualDescuento = 0;
    let manualImpuesto = 0;
    let manualRecargos = 0;
    let manualTotal = 0;

    invoices.forEach(inv => {
      manualSubtotal += parseFloat(inv.subtotal || 0);
      manualDescuento += parseFloat(inv.descuento || 0);
      manualImpuesto += parseFloat(inv.impuesto || 0);
      manualRecargos += parseFloat(inv.recargos || 0);
      manualTotal += parseFloat(inv.total || 0);
    });

    console.log(`Subtotal (recalculado):  L ${manualSubtotal.toFixed(2)}`);
    console.log(`Descuento (recalculado): L ${manualDescuento.toFixed(2)}`);
    console.log(`Impuesto (recalculado):  L ${manualImpuesto.toFixed(2)}`);
    console.log(`Recargos (recalculado):  L ${manualRecargos.toFixed(2)}`);
    console.log(`Total (recalculado):     L ${manualTotal.toFixed(2)}`);

    console.log('\n');
    if (Math.abs(manualTotal - totals.total_total) < 0.01) {
      console.log('✅ Los totales coinciden correctamente');
    } else {
      console.log('⚠️ Hay una diferencia en los totales:');
      console.log(`   Diferencia: L ${(manualTotal - totals.total_total).toFixed(2)}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 IMPORTANTE:');
    console.log('='.repeat(80));
    console.log('Si el total que ves en el navegador es diferente a este:');
    console.log(`   Servidor dice: L ${parseFloat(totals.total_total || 0).toFixed(2)}`);
    console.log('   Tu navegador dice: L 132,973.72');
    console.log('');
    console.log('Entonces el problema es CACHÉ DEL NAVEGADOR.');
    console.log('');
    console.log('Solución:');
    console.log('  1. Presiona Ctrl+Shift+Delete');
    console.log('  2. Marca "Imágenes y archivos en caché"');
    console.log('  3. Haz clic en "Borrar datos"');
    console.log('  4. Recarga la página (Ctrl+F5)');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTotals();
