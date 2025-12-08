const mysql = require('mysql2/promise');

async function addSellerColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Verificando columnas de vendedor...');

    const [columns] = await connection.query('SHOW COLUMNS FROM invoices');
    const hasSellerId = columns.some(c => c.Field === 'seller_id');
    const hasSellerName = columns.some(c => c.Field === 'seller_name');

    console.log('seller_id:', hasSellerId ? 'EXISTE' : 'FALTA');
    console.log('seller_name:', hasSellerName ? 'EXISTE' : 'FALTA');

    if (!hasSellerId) {
      await connection.query('ALTER TABLE invoices ADD COLUMN seller_id INT NULL AFTER warehouse_id');
      console.log('✓ seller_id agregado');
    }

    if (!hasSellerName) {
      await connection.query('ALTER TABLE invoices ADD COLUMN seller_name VARCHAR(255) NULL AFTER seller_id');
      console.log('✓ seller_name agregado');
    }

    console.log('\nProceso completado.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addSellerColumns();
