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

async function createTestUser() {
  let connection;

  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Conectado\n');

    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      ['test@prosperpos.com']
    );

    if (existingUsers.length > 0) {
      console.log('Usuario de prueba ya existe');
      console.log('Email: test@prosperpos.com');
      console.log('Password: Test123');
      console.log('ID:', existingUsers[0].id);
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('Test123', 10);

    // Crear usuario de prueba
    const [result] = await connection.query(
      `INSERT INTO users (
        first_name, last_name, email, password,
        role, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      ['Test', 'User', 'test@prosperpos.com', hashedPassword, 'admin', 'active']
    );

    console.log('✓ Usuario de prueba creado exitosamente');
    console.log('\nCredenciales:');
    console.log('Email: test@prosperpos.com');
    console.log('Password: Test123');
    console.log('ID:', result.insertId);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestUser();
