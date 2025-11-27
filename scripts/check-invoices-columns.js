const mysql = require('mysql2/promise');

async function checkInvoicesColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Verificando columnas de la tabla invoices...\n');

    const [columns] = await connection.query('SHOW COLUMNS FROM invoices');

    console.log('Todas las columnas:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check for _by columns
    const byColumns = columns.filter(col => col.Field.endsWith('_by'));
    console.log('\nColumnas _by encontradas:');
    if (byColumns.length === 0) {
      console.log('  NINGUNA - Necesita agregar created_by y updated_by');
    } else {
      byColumns.forEach(col => {
        console.log(`  - ${col.Field}`);
      });
    }

    // Check if created_by exists
    const hasCreatedBy = columns.some(col => col.Field === 'created_by');
    const hasUpdatedBy = columns.some(col => col.Field === 'updated_by');

    console.log('\nEstado:');
    console.log(`  created_by: ${hasCreatedBy ? 'EXISTE' : 'FALTA'}`);
    console.log(`  updated_by: ${hasUpdatedBy ? 'EXISTE' : 'FALTA'}`);

    if (!hasCreatedBy || !hasUpdatedBy) {
      console.log('\nAgregando columnas faltantes...');

      if (!hasCreatedBy) {
        await connection.query('ALTER TABLE invoices ADD COLUMN created_by INT NULL');
        console.log('  ✓ created_by agregada');
      }

      if (!hasUpdatedBy) {
        await connection.query('ALTER TABLE invoices ADD COLUMN updated_by INT NULL');
        console.log('  ✓ updated_by agregada');
      }
    }

    console.log('\nProceso completado.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkInvoicesColumns();
