const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkOpinions() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    console.log('🔍 Verificando opiniones en la base de datos...\n');

    // 1. Verificar que la tabla existe
    const [tables] = await connection.query("SHOW TABLES LIKE 'customer_opinions'");
    console.log('1️⃣ Tabla customer_opinions existe:', tables.length > 0);

    if (tables.length === 0) {
      console.log('❌ La tabla NO existe. Ejecuta: node create-customer-opinions-table.js');
      return;
    }

    // 2. Contar opiniones
    const [count] = await connection.query('SELECT COUNT(*) as total FROM customer_opinions');
    console.log('2️⃣ Total de opiniones:', count[0].total);

    // 3. Mostrar algunas opiniones
    const [opinions] = await connection.query('SELECT * FROM customer_opinions LIMIT 5');
    console.log('3️⃣ Opiniones en la base de datos:');
    console.table(opinions.map(o => ({
      ID: o.id,
      Nombre: `${o.name} ${o.lastname}`,
      Email: o.email,
      Tipo: o.inquiry_type,
      Estado: o.status,
      Fecha: o.created_at
    })));

    // 4. Probar la consulta exacta que usa el servicio
    console.log('\n4️⃣ Probando consulta del servicio...');
    const [serviceResult] = await connection.query(`
      SELECT
        co.*,
        CONCAT(u.first_name, ' ', u.last_name) as admin_name,
        u.email as admin_email
      FROM customer_opinions co
      LEFT JOIN users u ON co.admin_user_id = u.id
      ORDER BY co.created_at DESC
      LIMIT 1000
    `);
    console.log('✅ Consulta exitosa, registros encontrados:', serviceResult.length);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Código:', error.code);
    console.error('SQL:', error.sql);
  } finally {
    await connection.end();
  }
}

checkOpinions();
