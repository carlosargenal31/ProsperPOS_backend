const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateLogo() {
  let connection;
  try {
    console.log('Conectando a la base de datos...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos',
      port: process.env.DB_PORT || 3306
    });

    console.log('Conexión exitosa!\n');

    const logoUrl = 'https://storage.googleapis.com/prosperpos-images/categories/category_1.jpg';

    // Actualizar
    const [result] = await connection.execute(
      'UPDATE companies SET logo_url = ? WHERE is_default = 1 OR id = 1',
      [logoUrl]
    );

    console.log('✓ Logo actualizado exitosamente!');
    console.log(`  Registros afectados: ${result.affectedRows}`);
    console.log(`  Nuevo logo URL: ${logoUrl}\n`);

    // Verificar
    const [companies] = await connection.execute(
      'SELECT id, name, commercial_name, logo_url FROM companies WHERE is_default = 1 OR id = 1 LIMIT 1'
    );

    if (companies && companies.length > 0) {
      console.log('Verificación:');
      console.log(`  ID: ${companies[0].id}`);
      console.log(`  Nombre: ${companies[0].name || 'N/A'}`);
      console.log(`  Nombre Comercial: ${companies[0].commercial_name || 'N/A'}`);
      console.log(`  Logo URL: ${companies[0].logo_url || 'NO CONFIGURADO'}`);
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

updateLogo();
