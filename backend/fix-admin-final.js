const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prosperpos',
  port: process.env.DB_PORT || 3306
};

async function fixAdmin() {
  let connection;

  try {
    console.log('🔧 Corrigiendo usuario administrador...\n');
    connection = await mysql.createConnection(dbConfig);

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash('Admin1234', 10);

    // Actualizar usuario
    await connection.query(`
      UPDATE users
      SET password = ?,
          status = 'active',
          is_active = 1
      WHERE email = 'admin@prosperpos.com'
    `, [hashedPassword]);

    // Verificar
    const [users] = await connection.query(`
      SELECT id, first_name, last_name, email, status, is_active, role_id
      FROM users
      WHERE email = 'admin@prosperpos.com'
    `);

    if (users.length > 0) {
      const user = users[0];
      console.log('✅ USUARIO ADMINISTRADOR ACTUALIZADO');
      console.log('═══════════════════════════════════════');
      console.log(`   Nombre:    ${user.first_name} ${user.last_name}`);
      console.log(`   Email:     ${user.email}`);
      console.log(`   Estado:    ${user.status}`);
      console.log(`   Activo:    ${user.is_active ? 'SÍ' : 'NO'}`);
      console.log(`   Role ID:   ${user.role_id || 'NULL'}`);
      console.log('═══════════════════════════════════════\n');

      console.log('📝 CREDENCIALES PARA INICIAR SESIÓN:');
      console.log('═══════════════════════════════════════');
      console.log('   Email:     admin@prosperpos.com');
      console.log('   Password:  Admin1234');
      console.log('═══════════════════════════════════════\n');

      console.log('🌐 ACCEDE AL SISTEMA:');
      console.log('   Frontend:  http://localhost:3001');
      console.log('   Backend:   http://localhost:3000\n');

      console.log('✅ ¡Listo! Ahora puedes iniciar sesión');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAdmin();
