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

  const [opinions] = await connection.query('SELECT id, name, lastname, email, status, admin_response FROM customer_opinions ORDER BY created_at DESC LIMIT 5');
  console.log('\n📋 Opiniones en base de datos:\n');
  opinions.forEach(op => {
    console.log(`ID: ${op.id}`);
    console.log(`Email: ${op.email}`);
    console.log(`Estado: ${op.status}`);
    console.log(`Respuesta: ${op.admin_response ? 'SI' : 'NO'}`);
    console.log('---');
  });

  await connection.end();
}

checkOpinions().catch(console.error);
