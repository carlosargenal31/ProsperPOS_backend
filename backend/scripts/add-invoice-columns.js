const mysql = require('mysql2/promise');

async function addMissingColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Verificando columnas de la tabla invoices...');

    // Obtener columnas existentes
    const [columns] = await connection.query('SHOW COLUMNS FROM invoices');
    const existingColumns = columns.map(col => col.Field);
    console.log('Columnas existentes:', existingColumns.join(', '));

    // Columnas a agregar si no existen
    const columnsToAdd = [
      { name: 'balance_due', sql: 'ADD COLUMN balance_due DECIMAL(12,2) DEFAULT 0' },
      { name: 'paid_amount', sql: 'ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0' },
      { name: 'is_credit', sql: 'ADD COLUMN is_credit TINYINT(1) DEFAULT 0' },
      { name: 'payment_terms_days', sql: 'ADD COLUMN payment_terms_days INT DEFAULT 0' },
      { name: 'resolution_id', sql: 'ADD COLUMN resolution_id INT NULL' },
      { name: 'resolution_number', sql: 'ADD COLUMN resolution_number VARCHAR(100) NULL' },
      { name: 'discount_type', sql: 'ADD COLUMN discount_type VARCHAR(20) NULL' },
      { name: 'discount_value', sql: 'ADD COLUMN discount_value DECIMAL(12,2) DEFAULT 0' },
      { name: 'discount_amount', sql: 'ADD COLUMN discount_amount DECIMAL(12,2) DEFAULT 0' },
      { name: 'shipping_cost', sql: 'ADD COLUMN shipping_cost DECIMAL(12,2) DEFAULT 0' }
    ];

    let addedCount = 0;
    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`Agregando columna: ${col.name}...`);
        await connection.query(`ALTER TABLE invoices ${col.sql}`);
        console.log(`  ✓ ${col.name} agregada`);
        addedCount++;
      } else {
        console.log(`  - ${col.name} ya existe`);
      }
    }

    console.log(`\nProceso completado. ${addedCount} columnas agregadas.`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addMissingColumns();
