const mysql = require('mysql2/promise');

async function fixBankColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Modificando columna bank para permitir NULL...');

    await connection.query(`
      ALTER TABLE cash_register_bank_payments
      MODIFY COLUMN bank VARCHAR(255) NULL
    `);

    console.log('✓ Columna bank ahora permite NULL');

    // Mostrar estructura actualizada
    const [structure] = await connection.query(`
      DESCRIBE cash_register_bank_payments
    `);

    console.log('\nEstructura actualizada:');
    structure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixBankColumn();
