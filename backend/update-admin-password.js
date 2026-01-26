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

async function updateAdminPassword() {
  let connection;

  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Conectado\n');

    // Hash de la contraseña correcta
    const hashedPassword = await bcrypt.hash('Admin1234', 10);

    // Actualizar la contraseña y activar el usuario
    const [result] = await connection.query(`
      UPDATE users
      SET password = ?,
          status = 'active'
      WHERE email = 'admin@prosperpos.com'
    `, [hashedPassword]);

    console.log(`✓ ${result.affectedRows} usuario(s) actualizado(s)`);

    // Verificar
    const [users] = await connection.query(`
      SELECT id, first_name, last_name, email, status
      FROM users
      WHERE email = 'admin@prosperpos.com'
    `);

    if (users.length > 0) {
      const user = users[0];
      console.log('\n✅ Usuario admin actualizado exitosamente:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Estado: ${user.status}`);
      console.log('\n📝 Credenciales correctas:');
      console.log('   Email: admin@prosperpos.com');
      console.log('   Password: Admin1234');
      console.log('\n🌐 URLs:');
      console.log('   Backend: http://localhost:3000');
      console.log('   Frontend (Template): http://localhost:3001');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateAdminPassword();
