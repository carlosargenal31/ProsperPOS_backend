const mysql = require('mysql2/promise');

async function agregarPermisosLectura() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('✅ Conectado a la base de datos');

    // Obtener el ID del rol vendedor
    const [roles] = await connection.execute(
      'SELECT id FROM roles WHERE slug = ?',
      ['vendedor']
    );

    if (!roles || roles.length === 0) {
      console.log('❌ No se encontró el rol vendedor');
      return;
    }

    const roleId = roles[0].id;
    console.log(`✅ Rol vendedor encontrado con ID: ${roleId}`);

    // Permisos adicionales de lectura que faltan
    const permisosNecesarios = [
      { name: 'branches.read', module: 'branches', description: 'Ver sucursales' },
      { name: 'subcategories.read', module: 'subcategories', description: 'Ver subcategorías' }
    ];

    console.log('\n📋 AGREGANDO PERMISOS DE LECTURA...\n');

    for (const permiso of permisosNecesarios) {
      // Verificar si el permiso existe
      const [existingPermission] = await connection.execute(
        'SELECT id FROM permissions WHERE name = ?',
        [permiso.name]
      );

      let permissionId;

      if (existingPermission.length === 0) {
        // Crear el permiso si no existe
        const [result] = await connection.execute(
          `INSERT INTO permissions (name, slug, description, module, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [permiso.name, permiso.name, permiso.description, permiso.module]
        );
        permissionId = result.insertId;
        console.log(`  ✅ Permiso creado: ${permiso.name} (ID: ${permissionId})`);
      } else {
        permissionId = existingPermission[0].id;
        console.log(`  ℹ️  Permiso ya existe: ${permiso.name} (ID: ${permissionId})`);
      }

      // Verificar si ya está asignado al rol
      const [existing] = await connection.execute(
        'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [roleId, permissionId]
      );

      if (existing.length === 0) {
        // Asignar permiso al rol
        await connection.execute(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, permissionId]
        );
        console.log(`  ✅ Permiso asignado a vendedor: ${permiso.name}`);
      } else {
        console.log(`  ✅ Permiso ya estaba asignado: ${permiso.name}`);
      }
    }

    console.log('\n✅ Permisos agregados exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

agregarPermisosLectura();
