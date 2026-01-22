require('dotenv').config();
const mysql = require('mysql2/promise');

async function addCancellationFields() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Agregando campos de cancelación a la tabla orders...');

    // Verificar si las columnas ya existen
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
       AND COLUMN_NAME IN ('cancellation_reason', 'cancelled_by', 'cancelled_at')`,
      [process.env.DB_NAME]
    );

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    if (!existingColumns.includes('cancellation_reason')) {
      await connection.execute(`
        ALTER TABLE orders
        ADD COLUMN cancellation_reason TEXT NULL
        COMMENT 'Motivo de cancelación del pedido'
      `);
      console.log('✓ Columna cancellation_reason agregada');
    } else {
      console.log('- Columna cancellation_reason ya existe');
    }

    if (!existingColumns.includes('cancelled_by')) {
      await connection.execute(`
        ALTER TABLE orders
        ADD COLUMN cancelled_by VARCHAR(100) NULL
        COMMENT 'Quién canceló el pedido (cliente o admin)'
      `);
      console.log('✓ Columna cancelled_by agregada');
    } else {
      console.log('- Columna cancelled_by ya existe');
    }

    if (!existingColumns.includes('cancelled_at')) {
      await connection.execute(`
        ALTER TABLE orders
        ADD COLUMN cancelled_at TIMESTAMP NULL
        COMMENT 'Fecha y hora de cancelación'
      `);
      console.log('✓ Columna cancelled_at agregada');
    } else {
      console.log('- Columna cancelled_at ya existe');
    }

    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addCancellationFields();
