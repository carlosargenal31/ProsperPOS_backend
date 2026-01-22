// Script para revertir cambios de Google ID en users y eliminar usuarios específicos

const db = require('./src/utils/database');

async function revertUsersGoogleChanges() {
  await db.connectDatabase();

  try {
    console.log('🔄 Iniciando reversión de cambios...\n');

    // 1. Verificar si existe la columna google_id en users
    const columns = await db.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'google_id'
    `);

    if (columns.length > 0) {
      console.log('✅ Columna google_id encontrada en users');

      // Eliminar la columna google_id
      await db.execute(`
        ALTER TABLE users
        DROP COLUMN google_id
      `);
      console.log('✅ Columna google_id eliminada de users\n');
    } else {
      console.log('ℹ️  Columna google_id no existe en users\n');
    }

    // 2. Eliminar usuarios con ID 65 y 2028
    const user65 = await db.execute('SELECT * FROM users WHERE id = 65');
    if (user65.length > 0) {
      await db.execute('DELETE FROM users WHERE id = 65');
      console.log('✅ Usuario con ID 65 eliminado:', user65[0].username || user65[0].email);
    } else {
      console.log('ℹ️  Usuario con ID 65 no encontrado');
    }

    const user2028 = await db.execute('SELECT * FROM users WHERE id = 2028');
    if (user2028.length > 0) {
      await db.execute('DELETE FROM users WHERE id = 2028');
      console.log('✅ Usuario con ID 2028 eliminado:', user2028[0].username || user2028[0].email);
    } else {
      console.log('ℹ️  Usuario con ID 2028 no encontrado');
    }

    console.log('\n✅ Reversión completada exitosamente');

    // Mostrar usuarios restantes
    const remainingUsers = await db.execute(`
      SELECT id, username, email, role
      FROM users
      ORDER BY id
    `);

    console.log('\n📋 Usuarios restantes en la tabla users:');
    remainingUsers.forEach(user => {
      console.log(`  - ID: ${user.id} | Usuario: ${user.username || 'N/A'} | Email: ${user.email} | Rol: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

revertUsersGoogleChanges()
  .then(() => {
    console.log('\n✨ Proceso finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
