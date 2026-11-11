const mysql = require('mysql2/promise');

async function configurarPermisosVendedor() {
  let connection;

  try {
    // Conectar a la base de datos
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

    // Permisos que debe tener vendedor (SOLO LECTURA)
    const permisosLectura = [
      { module: 'coupons', action: 'read', name: 'coupons.read' },
      { module: 'offers', action: 'read', name: 'offers.read' },
      { module: 'products', action: 'read', name: 'products.read' }
    ];

    // Permisos que NO debe tener vendedor (crear, actualizar, eliminar)
    const permisosProhibidos = [
      'coupons.create', 'coupons.update', 'coupons.delete',
      'offers.create', 'offers.update', 'offers.delete',
      'products.create', 'products.update', 'products.delete'
    ];

    console.log('\n📋 AGREGANDO PERMISOS DE SOLO LECTURA...\n');

    // Agregar permisos de lectura
    for (const permiso of permisosLectura) {
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
          [
            permiso.name,
            permiso.name,
            `Permiso para ${permiso.action} ${permiso.module}`,
            permiso.module
          ]
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

    console.log('\n🚫 ELIMINANDO PERMISOS DE ESCRITURA...\n');

    // Eliminar permisos prohibidos
    for (const permisoName of permisosProhibidos) {
      // Buscar el permiso
      const [permission] = await connection.execute(
        'SELECT id FROM permissions WHERE name = ?',
        [permisoName]
      );

      if (permission.length > 0) {
        const permissionId = permission[0].id;

        // Eliminar la asignación del rol si existe
        const [result] = await connection.execute(
          'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
          [roleId, permissionId]
        );

        if (result.affectedRows > 0) {
          console.log(`  ✅ Permiso removido: ${permisoName}`);
        } else {
          console.log(`  ℹ️  Permiso no estaba asignado: ${permisoName}`);
        }
      } else {
        console.log(`  ℹ️  Permiso no existe en DB: ${permisoName}`);
      }
    }

    // Mostrar resumen de permisos actuales
    console.log('\n📊 RESUMEN DE PERMISOS PARA VENDEDOR:\n');

    const [currentPermissions] = await connection.execute(`
      SELECT p.name, p.module
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.module, p.name
    `, [roleId]);

    const groupedPermissions = {};
    currentPermissions.forEach(p => {
      if (!groupedPermissions[p.module]) {
        groupedPermissions[p.module] = [];
      }
      groupedPermissions[p.module].push(p.name);
    });

    Object.keys(groupedPermissions).sort().forEach(module => {
      console.log(`  📦 ${module}:`);
      groupedPermissions[module].forEach(perm => {
        console.log(`    - ${perm}`);
      });
    });

    console.log('\n✅ Configuración de permisos completada exitosamente');

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

// Ejecutar
configurarPermisosVendedor();
