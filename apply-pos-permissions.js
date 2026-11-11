const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyPermissions() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('✅ Conectado a la base de datos');

    // Permisos a agregar
    const permissions = [
      'billing.access',
      'billing.invoices.view',
      'billing.invoices.create',
      'billing.invoices.print',
      'billing.payments.record',
      'pending_invoices.view',
      'pending_invoices.create',
      'pending_invoices.update',
      'pending_invoices.delete',
      'quotes.view',
      'quotes.create',
      'quotes.update',
      'sales.view',
      'sales.create',
      'sales_returns.view',
      'sales_returns.create',
      'coupons.view',
      'offers.view'
    ];

    // Buscar rol de vendedor
    const [roles] = await connection.execute(
      "SELECT id, role_name FROM roles WHERE role_name IN ('vendedor', 'cashier', 'cajero')"
    );

    if (roles.length === 0) {
      console.log('⚠️ No se encontró rol de vendedor');
      return;
    }

    console.log('\n📋 Roles encontrados:', roles.map(r => `${r.role_name} (ID: ${r.id})`).join(', '));

    for (const role of roles) {
      console.log(`\n🔧 Procesando rol: ${role.role_name}`);
      let added = 0;
      let existing = 0;

      for (const perm of permissions) {
        const [exists] = await connection.execute(
          'SELECT id FROM role_permissions WHERE role_id = ? AND permission = ?',
          [role.id, perm]
        );

        if (exists.length === 0) {
          await connection.execute(
            'INSERT INTO role_permissions (role_id, permission) VALUES (?, ?)',
            [role.id, perm]
          );
          added++;
        } else {
          existing++;
        }
      }

      console.log(`  ✅ Permisos agregados: ${added}`);
      console.log(`  ⏭️  Ya existentes: ${existing}`);
    }

    console.log('\n✅ ¡Proceso completado exitosamente!');
    console.log('⚠️ IMPORTANTE: Los usuarios deben cerrar sesión y volver a iniciar para aplicar los cambios');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyPermissions();
