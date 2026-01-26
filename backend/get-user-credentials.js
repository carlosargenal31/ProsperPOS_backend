require('dotenv').config();
const db = require('./src/utils/database');

async function getUser() {
  try {
    await db.connectDatabase();

    const users = await db.query(`
      SELECT id, first_name, last_name, email, username
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY id
      LIMIT 3
    `);

    console.log('👥 Usuarios disponibles:\n');
    users.forEach(u => {
      console.log(`ID: ${u.id} | ${u.first_name} ${u.last_name} (${u.email || u.username})`);
    });

    console.log('\n💡 Intenta iniciar sesión con alguno de estos usuarios');
    console.log('La contraseña por defecto suele ser: Admin123 o Admin1234\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getUser();
