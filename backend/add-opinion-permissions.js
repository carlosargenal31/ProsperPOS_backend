// ===================================================================
// PROSPERPOS - AGREGAR PERMISOS DE OPINIONES
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addOpinionPermissions() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    console.log('🔄 Agregando permisos de opiniones...');

    // Verificar si ya existen los permisos
    const [existing] = await connection.query(
      `SELECT COUNT(*) as count FROM permissions WHERE slug LIKE 'opinions.%'`
    );

    if (existing[0].count > 0) {
      console.log('⚠️  Los permisos de opiniones ya existen. Saltando...');
      return;
    }

    // Insertar permisos
    const permissions = [
      {
        name: 'Ver Opiniones',
        slug: 'opinions.read',
        description: 'Ver opiniones de clientes',
        module: 'Opiniones'
      },
      {
        name: 'Responder Opiniones',
        slug: 'opinions.update',
        description: 'Responder opiniones de clientes',
        module: 'Opiniones'
      },
      {
        name: 'Eliminar Opiniones',
        slug: 'opinions.delete',
        description: 'Eliminar opiniones de clientes',
        module: 'Opiniones'
      }
    ];

    for (const permission of permissions) {
      await connection.query(
        `INSERT INTO permissions (name, slug, description, module, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
        [permission.name, permission.slug, permission.description, permission.module]
      );
      console.log(`✅ Permiso agregado: ${permission.slug}`);
    }

    // Asignar permisos al rol de administrador (role_id = 1)
    const [permissionsIds] = await connection.query(
      `SELECT id FROM permissions WHERE slug LIKE 'opinions.%'`
    );

    for (const perm of permissionsIds) {
      await connection.query(
        `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
         VALUES (1, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [perm.id]
      );
    }

    console.log('✅ Permisos asignados al rol de Administrador');

    // Mostrar permisos creados
    const [createdPerms] = await connection.query(
      `SELECT * FROM permissions WHERE slug LIKE 'opinions.%' ORDER BY name`
    );

    console.log('\n📊 Permisos creados:');
    console.table(createdPerms);

  } catch (error) {
    console.error('❌ Error agregando permisos:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar script
addOpinionPermissions()
  .then(() => {
    console.log('\n✅ Permisos agregados exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
