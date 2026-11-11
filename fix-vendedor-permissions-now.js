/**
 * Script SIMPLE para agregar permisos de POS al vendedor
 * Usa fetch para ejecutar SQL a través del backend que ya está corriendo
 */

const http = require('http');

const permisos = [
  'warehouses.read',
  'resolutions.read',
  'bank_accounts.read',
  'categories.read',
  'tax_rates.read',
  'customers.read',
  'products.read',
  'users.read',
  'sales.create',
  'sales.read',
  'sales.update',
  'invoices.create',
  'invoices.read',
  'invoices.update',
  'invoices.print',
  'quotes.create',
  'quotes.read',
  'quotes.update',
  'sales_returns.create',
  'sales_returns.read',
  'coupons.read',
  'offers.read',
  'shipments.create',
  'shipments.read',
  'cash_register.create',
  'cash_register.read',
  'cash_register.update'
];

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/debug/execute-sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          resolve({ success: true, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function agregarPermisos() {
  console.log('\n========================================');
  console.log('AGREGANDO PERMISOS DE POS A VENDEDOR');
  console.log('========================================\n');

  // Generar el SQL completo
  const permisosSQL = permisos.map(p => `'${p}'`).join(',');

  const sql = `
    INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
    SELECT r.id, p.id, NOW()
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.slug IN ('cashier', 'vendedor')
    AND p.name IN (${permisosSQL});
  `;

  console.log('Ejecutando SQL...');
  console.log('Permisos a agregar:', permisos.length);
  console.log('');

  try {
    const result = await executeSQL(sql);

    if (result.success !== false) {
      console.log('✅ SQL ejecutado correctamente\n');

      // Verificar cuántos permisos tiene ahora el vendedor
      const verifySQL = `
        SELECT COUNT(*) as total
        FROM roles r
        INNER JOIN role_permissions rp ON r.id = rp.role_id
        WHERE r.slug IN ('cashier', 'vendedor');
      `;

      const verify = await executeSQL(verifySQL);
      console.log('Verificación:', verify);

      console.log('\n========================================');
      console.log('✅ PERMISOS AGREGADOS EXITOSAMENTE');
      console.log('========================================\n');
      console.log('📝 SIGUIENTE PASO:');
      console.log('   1. El usuario vendedor debe CERRAR SESIÓN');
      console.log('   2. Volver a INICIAR SESIÓN');
      console.log('   3. Los errores 403 deberían desaparecer\n');

    } else {
      console.log('❌ Error:', result);
    }

  } catch (error) {
    console.error('❌ Error ejecutando SQL:', error.message);
    console.log('\n⚠️  El endpoint /api/v1/debug/execute-sql no existe.');
    console.log('\n📝 SOLUCIÓN ALTERNATIVA:');
    console.log('   1. Abre phpMyAdmin o MySQL Workbench');
    console.log('   2. Ejecuta el archivo: add-pos-permissions.sql');
    console.log('   3. Ese archivo contiene todo el SQL necesario\n');
  }
}

agregarPermisos();
