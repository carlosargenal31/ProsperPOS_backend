/**
 * Script FINAL para agregar permisos de POS al vendedor
 * Usa las credenciales directamente del .env
 */

const mysql = require('mysql2/promise');

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

async function agregarPermisos() {
  let connection;

  try {
    console.log('\n========================================');
    console.log('AGREGANDO PERMISOS DE POS A VENDEDOR');
    console.log('========================================\n');

    // Conectar a la base de datos
    console.log('Conectando a MySQL...');
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('✅ Conectado a la base de datos\n');

    // 1. Obtener el rol vendedor
    console.log('1. Buscando rol vendedor...');
    const [roles] = await connection.execute(`
      SELECT id, name, slug
      FROM roles
      WHERE slug IN ('cashier', 'vendedor')
      LIMIT 1
    `);

    if (roles.length === 0) {
      console.error('❌ ERROR: No se encontró el rol vendedor');
      console.log('\nRoles disponibles:');
      const [allRoles] = await connection.execute('SELECT id, name, slug FROM roles');
      allRoles.forEach(r => console.log(`   - ${r.name} (slug: ${r.slug})`));
      process.exit(1);
    }

    const rol = roles[0];
    console.log(`✅ Rol encontrado: ${rol.name} (ID: ${rol.id}, Slug: ${rol.slug})\n`);

    // 2. Agregar cada permiso
    console.log(`2. Agregando ${permisos.length} permisos...\n`);

    let agregados = 0;
    let existentes = 0;
    let noEncontrados = 0;

    for (const permiso of permisos) {
      // Buscar el permiso
      const [permisoRow] = await connection.execute(`
        SELECT id FROM permissions WHERE name = ? LIMIT 1
      `, [permiso]);

      if (permisoRow.length === 0) {
        console.log(`⚠️  ${permiso} - NO EXISTE EN BD`);
        noEncontrados++;
        continue;
      }

      const permisoId = permisoRow[0].id;

      // Verificar si ya existe
      const [existe] = await connection.execute(`
        SELECT id FROM role_permissions
        WHERE role_id = ? AND permission_id = ?
        LIMIT 1
      `, [rol.id, permisoId]);

      if (existe.length > 0) {
        console.log(`✓  ${permiso} - YA EXISTE`);
        existentes++;
      } else {
        // Agregar el permiso
        await connection.execute(`
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          VALUES (?, ?, NOW())
        `, [rol.id, permisoId]);

        console.log(`✅ ${permiso} - AGREGADO`);
        agregados++;
      }
    }

    // 3. Verificar total de permisos
    console.log('\n3. Verificando permisos totales...');
    const [total] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM role_permissions
      WHERE role_id = ?
    `, [rol.id]);

    console.log(`\n========================================`);
    console.log('RESUMEN');
    console.log(`========================================`);
    console.log(`✅ Permisos AGREGADOS: ${agregados}`);
    console.log(`✓  Permisos YA EXISTENTES: ${existentes}`);
    console.log(`⚠️  Permisos NO ENCONTRADOS: ${noEncontrados}`);
    console.log(`📊 Total de permisos del vendedor: ${total[0].total}`);
    console.log(`========================================\n`);

    if (agregados > 0) {
      console.log('🎉 ¡PERMISOS AGREGADOS EXITOSAMENTE!\n');
    } else {
      console.log('✅ El vendedor ya tenía todos los permisos necesarios\n');
    }

    console.log('📝 SIGUIENTE PASO:');
    console.log('   1. El usuario vendedor debe CERRAR SESIÓN');
    console.log('   2. Volver a INICIAR SESIÓN');
    console.log('   3. Los permisos se cargan al iniciar sesión');
    console.log('   4. Los errores 403 deberían desaparecer\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 SOLUCIÓN:');
      console.log('   Las credenciales de MySQL son incorrectas.');
      console.log('   Verifica el archivo backend/.env:');
      console.log('   - DB_USER=root');
      console.log('   - DB_PASSWORD=310104');
      console.log('   - DB_NAME=prosperpos\n');
    }

    if (connection) {
      await connection.end();
    }

    process.exit(1);
  }
}

// Ejecutar
agregarPermisos();
