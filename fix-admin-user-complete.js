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

async function fixAdminUser() {
  let connection;

  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Conectado\n');

    // Primero verificar el estado actual
    console.log('1. Verificando estado actual del usuario admin...');
    const [currentUser] = await connection.query(`
      SELECT id, first_name, last_name, email, status, user_type
      FROM users
      WHERE email = 'admin@prosperpos.com'
    `);

    if (currentUser.length > 0) {
      console.log('   Estado actual:');
      console.log(`   - ID: ${currentUser[0].id}`);
      console.log(`   - Email: ${currentUser[0].email}`);
      console.log(`   - Status: ${currentUser[0].status}`);
      console.log(`   - User Type: ${currentUser[0].user_type || 'NULL'}`);
    }

    // Hash de la contraseña correcta
    console.log('\n2. Generando hash de contraseña Admin1234...');
    const hashedPassword = await bcrypt.hash('Admin1234', 10);
    console.log('   ✓ Hash generado');

    // Actualizar TODO: contraseña, status y user_type
    console.log('\n3. Actualizando usuario admin...');
    const [result] = await connection.query(`
      UPDATE users
      SET password = ?,
          status = 'active',
          user_type = 'admin'
      WHERE email = 'admin@prosperpos.com'
    `, [hashedPassword]);

    console.log(`   ✓ ${result.affectedRows} usuario(s) actualizado(s)`);

    // Verificar el resultado final
    console.log('\n4. Verificando actualización...');
    const [updatedUser] = await connection.query(`
      SELECT id, first_name, last_name, email, status, user_type
      FROM users
      WHERE email = 'admin@prosperpos.com'
    `);

    if (updatedUser.length > 0) {
      const user = updatedUser[0];
      console.log('\n✅ Usuario admin actualizado exitosamente:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Estado: ${user.status}`);
      console.log(`   Tipo: ${user.user_type}`);

      console.log('\n📝 Credenciales para iniciar sesión:');
      console.log('   ╔════════════════════════════════════╗');
      console.log('   ║  Email: admin@prosperpos.com      ║');
      console.log('   ║  Password: Admin1234              ║');
      console.log('   ╚════════════════════════════════════╝');

      console.log('\n🌐 URLs del sistema:');
      console.log('   Backend API: http://localhost:3000');
      console.log('   Frontend:    http://localhost:3001');

      console.log('\n✅ Ahora puedes iniciar sesión en http://localhost:3001');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

fixAdminUser();
