const mysql = require('mysql2/promise');

async function createCompanySettings() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    const [tables] = await connection.query('SHOW TABLES LIKE "company_settings"');

    if (tables.length === 0) {
      console.log('Tabla company_settings NO EXISTE. Creándola...');
      await connection.query(`
        CREATE TABLE company_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          company_name VARCHAR(255) NOT NULL DEFAULT 'MI EMPRESA',
          rtn VARCHAR(20),
          address TEXT,
          phone VARCHAR(50),
          email VARCHAR(100),
          logo_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await connection.query(`INSERT INTO company_settings (company_name) VALUES ('EMPRESA DE PRUEBA')`);
      console.log('✓ Tabla creada e insertado registro por defecto');
    } else {
      console.log('✓ Tabla company_settings ya existe');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

createCompanySettings();
