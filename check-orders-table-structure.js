const mysql = require('mysql2/promise');

async function checkOrdersTableStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Verificando estructura de la tabla orders...\n');

    // Obtener todas las columnas de la tabla orders
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
      AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Columnas actuales en la tabla orders:');
    console.log('=====================================\n');
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Lista de columnas requeridas
    const requiredColumns = [
      'receiver_name',
      'receiver_phone',
      'customer_dni',
      'invoice_type',
      'rtn',
      'business_name',
      'payment_method',
      'additional_comments'
    ];

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    console.log('\n=====================================');
    if (missingColumns.length > 0) {
      console.log('\n❌ Columnas faltantes:');
      missingColumns.forEach(col => console.log(`  - ${col}`));
      console.log('\nNecesitas ejecutar las migraciones para agregar estas columnas.');
    } else {
      console.log('\n✅ Todas las columnas requeridas existen en la tabla.');
    }

  } catch (error) {
    console.error('Error al verificar la tabla:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkOrdersTableStructure();
