/**
 * Script para configurar todos los permisos del personal de bodega
 *
 * Este script asigna todos los permisos necesarios para que el personal de bodega
 * pueda trabajar con productos, categorías, subcategorías, marcas, unidades,
 * códigos de barra, guías de remisión, manejo de inventario, ajuste de inventario,
 * lista de inventario físico y historial de existencias.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prosperpos',
  port: process.env.DB_PORT || 3306
};

// Permisos que debe tener el personal de bodega
const WAREHOUSE_PERMISSIONS = [
  // Productos - TODOS los permisos
  'products.read',
  'products.create',
  'products.update',
  'products.delete',
  'products.import',
  'products.export',

  // Categorías - TODOS los permisos
  'categories.read',
  'categories.create',
  'categories.update',
  'categories.delete',

  // Subcategorías - TODOS los permisos
  'subcategories.read',
  'subcategories.create',
  'subcategories.update',
  'subcategories.delete',

  // Marcas - TODOS los permisos
  'brands.read',
  'brands.create',
  'brands.update',
  'brands.delete',

  // Unidades - TODOS los permisos
  'units.read',
  'units.create',
  'units.update',
  'units.delete',

  // Tax Rates - Solo lectura (necesario para crear productos)
  'tax_rates.read',

  // Inventario - TODOS los permisos
  'inventory.read',
  'inventory.adjust',
  'inventory.transfer',
  'inventory.count',
  'inventory.movements',

  // Reportes de inventario
  'reports.inventory',
  'reports.export',

  // Guías de remisión (shipments)
  'shipments.read',
  'shipments.create',
  'shipments.update',
  'shipments.delete',

  // Dashboard (para ver estadísticas básicas)
  'dashboard.view'
];

async function configurarPermisosBodega() {
  let connection;

  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos\n');

    // 1. Buscar o crear el rol de bodega
    console.log('📋 Paso 1: Buscando rol de bodega...');
    const [roles] = await connection.query(
      `SELECT * FROM roles WHERE name IN ('warehouse', 'bodega', 'almacenista', 'personal_de_bodega')`
    );

    let roleId;
    if (roles.length > 0) {
      roleId = roles[0].id;
      console.log(`✅ Rol encontrado: ${roles[0].name} (ID: ${roleId})\n`);
    } else {
      console.log('⚠️  No se encontró rol de bodega, creando uno nuevo...');
      const [result] = await connection.query(
        `INSERT INTO roles (name, slug, description, is_active, created_at)
         VALUES ('warehouse', 'warehouse', 'Personal encargado del manejo de inventario y bodega', 1, NOW())`
      );
      roleId = result.insertId;
      console.log(`✅ Rol creado: warehouse (ID: ${roleId})\n`);
    }

    // 2. Obtener IDs de todos los permisos necesarios
    console.log('📋 Paso 2: Obteniendo IDs de permisos...');
    const permissionNames = WAREHOUSE_PERMISSIONS.map(p => `'${p}'`).join(',');
    const [permissions] = await connection.query(
      `SELECT id, name FROM permissions WHERE name IN (${permissionNames})`
    );

    console.log(`✅ Encontrados ${permissions.length} permisos de ${WAREHOUSE_PERMISSIONS.length} solicitados\n`);

    // Verificar si faltan permisos
    const foundPermissionNames = permissions.map(p => p.name);
    const missingPermissions = WAREHOUSE_PERMISSIONS.filter(p => !foundPermissionNames.includes(p));

    if (missingPermissions.length > 0) {
      console.log('⚠️  ADVERTENCIA: Los siguientes permisos no existen en la base de datos:');
      missingPermissions.forEach(p => console.log(`   - ${p}`));
      console.log('\n');
    }

    // 3. Eliminar permisos antiguos del rol
    console.log('📋 Paso 3: Eliminando permisos antiguos del rol...');
    await connection.query(
      `DELETE FROM role_permissions WHERE role_id = ?`,
      [roleId]
    );
    console.log('✅ Permisos antiguos eliminados\n');

    // 4. Asignar nuevos permisos
    console.log('📋 Paso 4: Asignando nuevos permisos...');
    const permissionIds = permissions.map(p => p.id);

    if (permissionIds.length > 0) {
      const values = permissionIds.map(permId => `(${roleId}, ${permId}, NOW())`).join(',');
      await connection.query(
        `INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ${values}`
      );
      console.log(`✅ Asignados ${permissionIds.length} permisos al rol\n`);
    }

    // 5. Actualizar permisos de usuarios con rol de bodega
    console.log('📋 Paso 5: Actualizando permisos de usuarios...');
    const [users] = await connection.query(
      `SELECT DISTINCT u.id, u.username, u.email
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       WHERE ur.role_id = ?`,
      [roleId]
    );

    console.log(`Encontrados ${users.length} usuarios con rol de bodega`);

    for (const user of users) {
      // Construir array de permisos
      const userPermissions = foundPermissionNames;
      const permissionsJson = JSON.stringify(userPermissions);

      await connection.query(
        `UPDATE users SET permissions = ? WHERE id = ?`,
        [permissionsJson, user.id]
      );

      console.log(`   ✅ Usuario actualizado: ${user.username} (${user.email})`);
    }

    console.log('\n');

    // 6. Mostrar resumen
    console.log('📊 RESUMEN DE PERMISOS ASIGNADOS:');
    console.log('='.repeat(60));
    console.log(`Total de permisos asignados: ${foundPermissionNames.length}`);
    console.log('\n📋 Permisos por módulo:');

    const permissionsByModule = {};
    foundPermissionNames.forEach(perm => {
      const [module] = perm.split('.');
      if (!permissionsByModule[module]) {
        permissionsByModule[module] = [];
      }
      permissionsByModule[module].push(perm);
    });

    Object.keys(permissionsByModule).forEach(module => {
      console.log(`\n   ${module.toUpperCase()}:`);
      permissionsByModule[module].forEach(perm => {
        console.log(`      ✓ ${perm}`);
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Configuración de permisos completada exitosamente');
    console.log('\n💡 IMPORTANTE:');
    console.log('   - Los usuarios deben cerrar sesión y volver a iniciar para ver los cambios');
    console.log('   - Recarga el frontend si es necesario');
    console.log('   - El botón POS ya está oculto para personal de bodega');

  } catch (error) {
    console.error('❌ Error al configurar permisos:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
configurarPermisosBodega()
  .then(() => {
    console.log('\n✨ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
