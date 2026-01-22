const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function getValidToken() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosper_pos'
    });

    console.log('✓ Conectado a MySQL');

    // Obtener el primer usuario
    const [users] = await connection.query('SELECT id, username, email, first_name, last_name FROM users LIMIT 1');

    if (users.length === 0) {
      console.log('No hay usuarios en la base de datos');
      return;
    }

    const user = users[0];
    console.log('\n=== USUARIO ===');
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Nombre:', user.first_name, user.last_name);

    // Generar un token JWT válido
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('\n=== TOKEN GENERADO ===');
    console.log(token);

    console.log('\n=== USAR EN PRUEBAS ===');
    console.log(`Authorization: Bearer ${token}`);

    return token;

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

getValidToken();
