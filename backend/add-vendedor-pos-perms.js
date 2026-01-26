const mysql = require('mysql2/promise');
require('dotenv').config();

async function addVendedorPermissions() {
  let conn;

  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('✅ Conectado a la base de datos\n');

    // IDs de permisos necesarios para POS Invoice
    const permissionIds = [
      170, // billing.access
      64,  // pos_access
      65,  // pos_open_close
      66,  // pos_cash_management
      25,  // sales_read
      26,  // sales_create
      68,  // quotations_read
      69,  // quotations_create
      102, // coupons_read
      194, // offers.read
      1,   // products_read
      15,  // customers_read
      77,  // warehouses_read
      110  // tax_rates_read
    ];

    // Rol vendedor ID = 4
    const roleId = 4;

    console.log('🔧 Agregando permisos al rol Vendedor (ID: 4)\n');

    let added = 0;
    let existing = 0;

    for (const permId of permissionIds) {
      // Obtener nombre del permiso
      const [perm] = await conn.execute(
        'SELECT slug, name FROM permissions WHERE id = ?',
        [permId]
      );

      if (perm.length === 0) {
        console.log(`  ⚠️  Permiso ID ${permId} no encontrado`);
        continue;
      }

      // Verificar si ya existe
      const [exists] = await conn.execute(
        'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [roleId, permId]
      );

      if (exists.length === 0) {
        await conn.execute(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, permId]
        );
        console.log(`  ✅ ${perm[0].slug.padEnd(40)} ${perm[0].name}`);
        added++;
      } else {
        existing++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   Permisos agregados: ${added}`);
    console.log(`   Ya existían: ${existing}`);
    console.log(`   Total: ${permissionIds.length}\n`);

    console.log('✅ ¡Proceso completado exitosamente!\n');
    console.log('⚠️  IMPORTANTE: Los usuarios vendedores deben:');
    console.log('   1. Cerrar sesión');
    console.log('   2. Volver a iniciar sesión');
    console.log('   para que los nuevos permisos surtan efecto.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

addVendedorPermissions();
