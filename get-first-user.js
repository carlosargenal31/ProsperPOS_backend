const mysql = require('mysql2/promise');
require('dotenv').config();

async function getFirstUser() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosper_pos'
    });

    console.log('✓ Conectado a MySQL');

    const [users] = await connection.query('SELECT id, username, email, first_name, last_name FROM users LIMIT 1');

    if (users.length > 0) {
      console.log('\n=== PRIMER USUARIO EN LA BASE DE DATOS ===');
      console.log('ID:', users[0].id);
      console.log('Username:', users[0].username);
      console.log('Email:', users[0].email);
      console.log('Nombre:', users[0].first_name, users[0].last_name);
    } else {
      console.log('No hay usuarios en la base de datos');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

getFirstUser();
