const mysql = require('mysql2/promise');

async function agregarPermisosVendedor() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  console.log('Conectado a la base de datos');

  // Obtener el ID del rol vendedor
  const [roles] = await connection.execute(
    'SELECT id FROM roles WHERE slug = ?',
    ['vendedor']
  );

  if (!roles || roles.length === 0) {
    console.log('No se encontro el rol vendedor');
    return;
  }

  const roleId = roles[0].id;
  console.log(`Rol vendedor encontrado con ID: ${roleId}`);

  // Permisos a verificar/agregar
  const permisosNecesarios = [
    { slug: 'branches.read', module: 'branches', name: 'Ver Sucursales' },
    { slug: 'subcategories.read', module: 'subcategories', name: 'Ver Subcategorias' },
    { slug: 'brands.read', module: 'brands', name: 'Ver Marcas' }
  ];

  for (const permiso of permisosNecesarios) {
    // Verificar si el permiso existe
    const [permisoExistente] = await connection.execute(
      'SELECT id FROM permissions WHERE slug = ?',
      [permiso.slug]
    );

    let permisoId;

    if (permisoExistente.length === 0) {
      // Crear el permiso
      const [result] = await connection.execute(
        'INSERT INTO permissions (slug, module, name) VALUES (?, ?, ?)',
        [permiso.slug, permiso.module, permiso.name]
      );
      permisoId = result.insertId;
      console.log(`Permiso ${permiso.slug} creado con ID: ${permisoId}`);
    } else {
      permisoId = permisoExistente[0].id;
      console.log(`Permiso ${permiso.slug} ya existe con ID: ${permisoId}`);
    }

    // Verificar si ya está asignado
    const [asignacion] = await connection.execute(
      'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
      [roleId, permisoId]
    );

    if (asignacion.length === 0) {
      // Asignar el permiso al rol
      await connection.execute(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        [roleId, permisoId]
      );
      console.log(`Permiso ${permiso.slug} asignado al rol vendedor`);
    } else {
      console.log(`Permiso ${permiso.slug} ya estaba asignado`);
    }
  }

  console.log('');
  console.log('PERMISOS CONFIGURADOS CORRECTAMENTE');

  await connection.end();
}

agregarPermisosVendedor().catch(console.error);
