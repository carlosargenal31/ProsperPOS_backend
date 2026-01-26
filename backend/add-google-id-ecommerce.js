require('dotenv').config();
const mysql = require('mysql2/promise');

async function addGoogleIdToEcommerceCustomers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    console.log('🔍 Verificando columna google_id en ecommerce_customers...');

    // Verificar si la columna google_id existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
        AND TABLE_NAME = 'ecommerce_customers'
        AND COLUMN_NAME = 'google_id'
    `);

    if (columns.length === 0) {
      console.log('➕ Agregando columna google_id a ecommerce_customers...');

      await connection.execute(`
        ALTER TABLE ecommerce_customers
        ADD COLUMN google_id VARCHAR(255) NULL AFTER email,
        ADD UNIQUE KEY unique_google_id (google_id)
      `);

      console.log('✅ Columna google_id agregada exitosamente');
    } else {
      console.log('✅ La columna google_id ya existe en ecommerce_customers');
    }

    // Verificar que la columna password pueda ser NULL
    console.log('🔍 Verificando que password pueda ser NULL...');

    const [passwordColumn] = await connection.execute(`
      SELECT IS_NULLABLE, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
        AND TABLE_NAME = 'ecommerce_customers'
        AND COLUMN_NAME = 'password'
    `);

    if (passwordColumn.length > 0 && passwordColumn[0].IS_NULLABLE === 'NO') {
      console.log('🔧 Modificando columna password para permitir NULL...');

      await connection.execute(`
        ALTER TABLE ecommerce_customers
        MODIFY COLUMN password VARCHAR(255) NULL
      `);

      console.log('✅ Columna password modificada para permitir NULL');
    } else {
      console.log('✅ La columna password ya permite NULL');
    }

    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addGoogleIdToEcommerceCustomers();
