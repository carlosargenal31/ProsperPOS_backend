const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prosperpos',
  port: process.env.DB_PORT || 3306
};

async function activateAdmin() {
  let connection;

  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Conectado\n');

    // Activar todos los usuarios admin
    const [result] = await connection.query(`
      UPDATE users
      SET status = 'active'
      WHERE email = 'admin@prosperpos.com'
    `);

    console.log(`✓ ${result.affectedRows} usuario(s) activado(s)`);

    // Verificar
    const [users] = await connection.query(`
      SELECT id, first_name, last_name, email, status
      FROM users
      WHERE email = 'admin@prosperpos.com'
    `);

    if (users.length > 0) {
      const user = users[0];
      console.log('\n✅ Usuario admin activado exitosamente:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Estado: ${user.status}`);
      console.log('\n📝 Credenciales:');
      console.log('   Email: admin@prosperpos.com');
      console.log('   Password: 123456');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

activateAdmin();
