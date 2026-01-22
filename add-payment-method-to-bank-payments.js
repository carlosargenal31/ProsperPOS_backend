const mysql = require('mysql2/promise');

async function addPaymentMethodColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Verificando columna payment_method en cash_register_bank_payments...');

    // Verificar si la columna ya existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
        AND TABLE_NAME = 'cash_register_bank_payments'
        AND COLUMN_NAME = 'payment_method'
    `);

    if (columns.length > 0) {
      console.log('✓ La columna payment_method ya existe');
    } else {
      console.log('Agregando columna payment_method...');

      await connection.query(`
        ALTER TABLE cash_register_bank_payments
        ADD COLUMN payment_method VARCHAR(50) NULL AFTER reference
      `);

      console.log('✓ Columna payment_method agregada exitosamente');
    }

    // Mostrar estructura actual de la tabla
    const [structure] = await connection.query(`
      DESCRIBE cash_register_bank_payments
    `);

    console.log('\nEstructura actual de cash_register_bank_payments:');
    structure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addPaymentMethodColumn();
