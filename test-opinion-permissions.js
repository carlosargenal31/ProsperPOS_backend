const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'prosperpos'
  });

  try {
    console.log('✅ Conectado a la base de datos\n');

    // Verificar permisos
    const [permissions] = await connection.query(
      'SELECT * FROM permissions WHERE slug LIKE "opinions.%"'
    );

    console.log('📋 Permisos de opiniones:');
    console.table(permissions);

    // Verificar role_permissions
    const [rolePerms] = await connection.query(
      `SELECT rp.*, p.name, p.slug
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = 1 AND p.slug LIKE 'opinions.%'`
    );

    console.log('\n👤 Permisos asignados al rol Administrator:');
    console.table(rolePerms);

    // Verificar si la tabla customer_opinions existe
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'customer_opinions'"
    );

    console.log('\n📊 Tabla customer_opinions existe:', tables.length > 0);

    if (tables.length > 0) {
      const [count] = await connection.query(
        'SELECT COUNT(*) as total FROM customer_opinions'
      );
      console.log('Total de opiniones:', count[0].total);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

test();
