/**
 * Script para agregar permisos faltantes a la base de datos
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

// Permisos que faltan
const MISSING_PERMISSIONS = [
  {
    name: 'subcategories.create',
    slug: 'subcategories_create',
    module: 'subcategories',
    description: 'Crear nuevas subcategorías'
  },
  {
    name: 'subcategories.update',
    slug: 'subcategories_update',
    module: 'subcategories',
    description: 'Actualizar subcategorías'
  },
  {
    name: 'subcategories.delete',
    slug: 'subcategories_delete',
    module: 'subcategories',
    description: 'Eliminar subcategorías'
  },
  {
    name: 'units.read',
    slug: 'units_read',
    module: 'units',
    description: 'Ver listado de unidades'
  },
  {
    name: 'units.create',
    slug: 'units_create',
    module: 'units',
    description: 'Crear nuevas unidades'
  },
  {
    name: 'units.update',
    slug: 'units_update',
    module: 'units',
    description: 'Actualizar unidades'
  },
  {
    name: 'units.delete',
    slug: 'units_delete',
    module: 'units',
    description: 'Eliminar unidades'
  },
  {
    name: 'shipments.update',
    slug: 'shipments_update',
    module: 'shipments',
    description: 'Actualizar guías de remisión'
  }
];

async function agregarPermisosFaltantes() {
  let connection;

  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos\n');

    console.log('📋 Agregando permisos faltantes...\n');

    for (const permission of MISSING_PERMISSIONS) {
      // Verificar si el permiso ya existe
      const [existing] = await connection.query(
        'SELECT id FROM permissions WHERE name = ?',
        [permission.name]
      );

      if (existing.length > 0) {
        console.log(`   ⚠️  Permiso ya existe: ${permission.name}`);
        continue;
      }

      // Insertar el permiso
      try {
        await connection.query(
          `INSERT INTO permissions (name, slug, module, description, is_active, created_at)
           VALUES (?, ?, ?, ?, 1, NOW())`,
          [permission.name, permission.slug, permission.module, permission.description]
        );
        console.log(`   ✅ Permiso creado: ${permission.name}`);
      } catch (error) {
        console.error(`   ❌ Error al crear permiso ${permission.name}:`, error.message);
      }
    }

    console.log('\n✅ Permisos faltantes agregados exitosamente');
    console.log('\n💡 Ahora ejecuta: node configurar-permisos-bodega-completo.js');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
agregarPermisosFaltantes()
  .then(() => {
    console.log('\n✨ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
