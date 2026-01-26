/**
 * Crear permisos faltantes críticos para el POS
 */

const mysql = require('mysql2/promise');

const permisosFaltantes = [
  { name: 'resolutions.read', description: 'Ver resoluciones de facturación', module: 'resolutions' },
  { name: 'offers.read', description: 'Ver ofertas', module: 'offers' },
  { name: 'shipments.read', description: 'Ver guías de remisión', module: 'shipments' }
];

async function crearPermisosFaltantes() {
  let connection;

  try {
    console.log('\n========================================');
    console.log('CREANDO PERMISOS FALTANTES');
    console.log('========================================\n');

    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('✅ Conectado a MySQL\n');

    // Crear cada permiso
    let creados = 0;
    let existentes = 0;

    for (const permiso of permisosFaltantes) {
      // Verificar si existe
      const [existe] = await connection.execute(`
        SELECT id FROM permissions WHERE name = ? LIMIT 1
      `, [permiso.name]);

      if (existe.length > 0) {
        console.log(`✓  ${permiso.name} - YA EXISTE`);
        existentes++;
      } else {
        // Crear el permiso (slug es el mismo que name)
        await connection.execute(`
          INSERT INTO permissions (name, slug, description, module, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [permiso.name, permiso.name, permiso.description, permiso.module]);

        console.log(`✅ ${permiso.name} - CREADO`);
        creados++;
      }
    }

    console.log(`\n✅ Permisos creados: ${creados}`);
    console.log(`✓  Permisos existentes: ${existentes}\n`);

    // Ahora agregar estos permisos al rol vendedor
    console.log('Agregando permisos al rol vendedor...\n');

    const [rol] = await connection.execute(`
      SELECT id FROM roles WHERE slug IN ('cashier', 'vendedor') LIMIT 1
    `);

    if (rol.length === 0) {
      console.error('❌ No se encontró el rol vendedor');
      await connection.end();
      process.exit(1);
    }

    const rolId = rol[0].id;
    let agregados = 0;

    for (const permiso of permisosFaltantes) {
      const [permisoRow] = await connection.execute(`
        SELECT id FROM permissions WHERE name = ? LIMIT 1
      `, [permiso.name]);

      if (permisoRow.length === 0) continue;

      const permisoId = permisoRow[0].id;

      // Verificar si ya está asignado
      const [asignado] = await connection.execute(`
        SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ? LIMIT 1
      `, [rolId, permisoId]);

      if (asignado.length === 0) {
        await connection.execute(`
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          VALUES (?, ?, NOW())
        `, [rolId, permisoId]);

        console.log(`✅ ${permiso.name} - ASIGNADO AL VENDEDOR`);
        agregados++;
      } else {
        console.log(`✓  ${permiso.name} - YA ASIGNADO`);
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ Permisos asignados al vendedor: ${agregados}`);
    console.log(`========================================\n`);

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (connection) {
      await connection.end();
    }

    process.exit(1);
  }
}

crearPermisosFaltantes();
