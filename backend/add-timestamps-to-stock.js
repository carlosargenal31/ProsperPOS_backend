require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prosperpos'
};

async function addTimestampsToStock() {
  let connection;

  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);

    console.log('Verificando estructura de la tabla stock...');

    // Verificar si las columnas ya existen
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'stock'
        AND COLUMN_NAME IN ('created_at', 'updated_at')
    `);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    console.log('Columnas de timestamp existentes:', existingColumns);

    // Agregar created_at si no existe
    if (!existingColumns.includes('created_at')) {
      console.log('\nAgregando columna created_at...');
      await connection.query(`
        ALTER TABLE stock
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✓ Columna created_at agregada');
    } else {
      console.log('✓ Columna created_at ya existe');
    }

    // Agregar updated_at si no existe
    if (!existingColumns.includes('updated_at')) {
      console.log('\nAgregando columna updated_at...');
      await connection.query(`
        ALTER TABLE stock
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('✓ Columna updated_at agregada');
    } else {
      console.log('✓ Columna updated_at ya existe');
    }

    // Verificar la estructura final
    const [finalColumns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'stock'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n✓ Estructura final de la tabla stock:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.COLUMN_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n✓ Migración completada exitosamente');

  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar la migración
addTimestampsToStock();
