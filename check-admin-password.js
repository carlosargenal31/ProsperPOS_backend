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

async function checkPassword() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [users] = await connection.query(
      'SELECT id, first_name, last_name, email, password FROM users WHERE email = ?',
      ['admin@prosperpos.com']
    );

    if (users.length === 0) {
      console.log('Usuario no encontrado');
      return;
    }

    const user = users[0];
    console.log('Usuario encontrado:');
    console.log('ID:', user.id);
    console.log('Nombre:', user.first_name, user.last_name);
    console.log('Email:', user.email);
    console.log('Password hash:', user.password);

    // Probar varias contraseñas
    const passwords = ['Admin1234', 'Admin123', 'admin123', 'admin', '123456'];

    console.log('\nProbando contraseñas:');
    for (const pwd of passwords) {
      const match = await bcrypt.compare(pwd, user.password);
      console.log(`${pwd}: ${match ? '✓ CORRECTO' : '✗ Incorrecto'}`);
      if (match) {
        console.log(`\n✅ La contraseña correcta es: ${pwd}`);
        break;
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkPassword();
