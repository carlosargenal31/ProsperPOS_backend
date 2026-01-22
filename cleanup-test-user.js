// Script para limpiar el usuario de prueba de Google OAuth
require('dotenv').config();
const db = require('./src/utils/database');

async function cleanupTestUser() {
  try {
    console.log('🧹 Limpiando usuario de prueba...');

    // Borrar de ecommerce_customers
    const ecommerceResult = await db.query(`
      DELETE FROM ecommerce_customers
      WHERE email = 'carlosargenal31@gmail.com'
    `);

    console.log(`✅ Ecommerce customer eliminado: ${ecommerceResult.affectedRows} registro(s)`);

    // Borrar de users (esto borrará automáticamente de user_roles y user_sessions por CASCADE)
    const usersResult = await db.query(`
      DELETE FROM users
      WHERE email = 'carlosargenal31@gmail.com'
    `);

    console.log(`✅ Usuario eliminado: ${usersResult.affectedRows} registro(s)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar usuario:', error);
    process.exit(1);
  }
}

cleanupTestUser();
