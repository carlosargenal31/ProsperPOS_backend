require('dotenv').config();
const mysql = require('mysql2/promise');

async function getAdminUser() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    const [users] = await connection.query(`
      SELECT id, email, first_name, last_name, role
      FROM users
      WHERE role = 'admin'
      LIMIT 1
    `);

    if (users.length > 0) {
      console.log('✅ Usuario admin encontrado:');
      console.log('   ID:', users[0].id);
      console.log('   Email:', users[0].email);
      console.log('   Nombre:', users[0].first_name, users[0].last_name);
      console.log('   Role:', users[0].role);
      console.log('\n⚠️ Nota: La contraseña debe ser la que configuraste en el sistema');
    } else {
      console.log('❌ No se encontró ningún usuario admin');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

getAdminUser();
