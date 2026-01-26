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
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Conectado\n');

    // Ver estructura de la tabla
    console.log('1. Verificando estructura de la tabla users...');
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM users
    `);

    console.log('   Columnas disponibles:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    // Ver estado actual
    console.log('\n2. Estado actual del usuario admin:');
    const [current] = await connection.query(`
      SELECT * FROM users WHERE email = 'admin@prosperpos.com'
    `);

    if (current.length > 0) {
      console.log('   Usuario encontrado:');
      console.log(`   - ID: ${current[0].id}`);
      console.log(`   - Email: ${current[0].email}`);
      console.log(`   - Status: ${current[0].status}`);
      console.log(`   - Role: ${current[0].role || 'NULL'}`);
    }

    // Hash de contraseña
    console.log('\n3. Generando hash de contraseña...');
    const hashedPassword = await bcrypt.hash('Admin1234', 10);

    // Actualizar
    console.log('\n4. Actualizando usuario...');
    const [result] = await connection.query(`
      UPDATE users
      SET password = ?,
          status = 'active'
      WHERE email = 'admin@prosperpos.com'
    `, [hashedPassword]);

    console.log(`   ✓ ${result.affectedRows} usuario(s) actualizado(s)`);

    // Verificar
    console.log('\n5. Verificación final:');
    const [final] = await connection.query(`
      SELECT id, first_name, last_name, email, status, role
      FROM users
      WHERE email = 'admin@prosperpos.com'
    `);

    if (final.length > 0) {
      const user = final[0];
      console.log('\n✅ USUARIO ACTUALIZADO EXITOSAMENTE:');
      console.log('   ╔════════════════════════════════════╗');
      console.log(`   ║ Nombre: ${(user.first_name + ' ' + user.last_name).padEnd(26)} ║`);
      console.log(`   ║ Email:  ${user.email.padEnd(26)} ║`);
      console.log(`   ║ Estado: ${user.status.padEnd(26)} ║`);
      console.log(`   ║ Rol:    ${(user.role || 'admin').padEnd(26)} ║`);
      console.log('   ╚════════════════════════════════════╝');

      console.log('\n📝 CREDENCIALES PARA LOGIN:');
      console.log('   ╔════════════════════════════════════╗');
      console.log('   ║  Email:    admin@prosperpos.com   ║');
      console.log('   ║  Password: Admin1234              ║');
      console.log('   ╚════════════════════════════════════╝');

      console.log('\n🌐 Accede a: http://localhost:3001');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAdmin();
