/**
 * Script para agregar TODOS los permisos necesarios para POS al rol de Vendedor (cashier)
 *
 * Permisos necesarios para POS Facturación:
 * - warehouses.read (para seleccionar bodega)
 * - resolutions.read (para obtener resolución de facturación)
 * - bank_accounts.read (para métodos de pago)
 * - categories.read (para filtrar productos)
 * - tax_rates.read (para calcular impuestos)
 * - sales.create (para crear facturas)
 * - sales.read (para ver facturas)
 * - invoices.create (para crear facturas)
 * - invoices.read (para ver facturas)
 * - customers.read (para seleccionar clientes)
 * - products.read (para agregar productos a la factura)
 */

const db = require('./src/utils/database');

async function addPOSPermissionsToCashier() {
  try {
    console.log('========================================');
    console.log('AGREGANDO PERMISOS DE POS A VENDEDOR');
    console.log('========================================\n');

    // 1. Obtener el ID del rol "cashier" (vendedor)
    const [cashierRole] = await db.query(`
      SELECT id, name, slug
      FROM roles
      WHERE slug = 'cashier'
      LIMIT 1
    `);

    if (!cashierRole) {
      console.error('❌ ERROR: No se encontró el rol "cashier"');
      console.log('\nVerifica que el rol exista en la tabla roles');
      process.exit(1);
    }

    console.log(`✅ Rol encontrado: ${cashierRole.name} (ID: ${cashierRole.id}, Slug: ${cashierRole.slug})\n`);

    // 2. Lista de permisos necesarios para POS
    const requiredPermissions = [
      // Permisos de lectura
      'warehouses.read',
      'resolutions.read',
      'bank_accounts.read',
      'categories.read',
      'tax_rates.read',
      'customers.read',
      'products.read',
      'users.read',

      // Permisos de ventas
      'sales.create',
      'sales.read',
      'sales.update',

      // Permisos de facturas
      'invoices.create',
      'invoices.read',
      'invoices.update',
      'invoices.print',

      // Permisos de cotizaciones
      'quotes.create',
      'quotes.read',
      'quotes.update',

      // Permisos de devoluciones
      'sales_returns.create',
      'sales_returns.read',

      // Permisos de cupones y ofertas
      'coupons.read',
      'offers.read',

      // Permisos de guías de remisión
      'shipments.create',
      'shipments.read',

      // Permisos de arqueo de caja
      'cash_register.create',
      'cash_register.read',
      'cash_register.update'
    ];

    console.log(`📋 Permisos a verificar/agregar: ${requiredPermissions.length}\n`);

    let addedCount = 0;
    let existingCount = 0;
    let notFoundCount = 0;

    for (const permissionName of requiredPermissions) {
      // Obtener ID del permiso
      const [permission] = await db.query(`
        SELECT id, name
        FROM permissions
        WHERE name = ?
        LIMIT 1
      `, [permissionName]);

      if (!permission) {
        console.log(`⚠️  Permiso "${permissionName}" no existe en la BD - SALTANDO`);
        notFoundCount++;
        continue;
      }

      // Verificar si el rol ya tiene este permiso
      const [existing] = await db.query(`
        SELECT id
        FROM role_permissions
        WHERE role_id = ? AND permission_id = ?
        LIMIT 1
      `, [cashierRole.id, permission.id]);

      if (existing) {
        console.log(`✓  ${permissionName} - YA EXISTE`);
        existingCount++;
      } else {
        // Agregar el permiso
        await db.query(`
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          VALUES (?, ?, NOW())
        `, [cashierRole.id, permission.id]);

        console.log(`✅ ${permissionName} - AGREGADO`);
        addedCount++;
      }
    }

    console.log('\n========================================');
    console.log('RESUMEN');
    console.log('========================================');
    console.log(`✅ Permisos agregados: ${addedCount}`);
    console.log(`✓  Permisos existentes: ${existingCount}`);
    console.log(`⚠️  Permisos no encontrados: ${notFoundCount}`);
    console.log(`📊 Total procesados: ${requiredPermissions.length}`);
    console.log('========================================\n');

    if (addedCount > 0) {
      console.log('🎉 ¡Permisos agregados exitosamente!');
      console.log('\n📝 SIGUIENTE PASO:');
      console.log('   1. El usuario vendedor debe CERRAR SESIÓN');
      console.log('   2. Volver a INICIAR SESIÓN');
      console.log('   3. Ahora el POS debería funcionar completamente\n');
    } else if (existingCount === requiredPermissions.length - notFoundCount) {
      console.log('✅ El rol ya tiene todos los permisos necesarios');
      console.log('\n📝 Si sigue habiendo errores 403:');
      console.log('   1. Cierra sesión del vendedor');
      console.log('   2. Vuelve a iniciar sesión');
      console.log('   3. Los permisos se actualizan en el token al iniciar sesión\n');
    }

    if (notFoundCount > 0) {
      console.log(`\n⚠️  ADVERTENCIA: ${notFoundCount} permisos no existen en la tabla permissions`);
      console.log('   Puede que algunos necesiten ser creados en la BD primero\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar
console.log('\n🚀 Iniciando script...\n');
addPOSPermissionsToCashier();
