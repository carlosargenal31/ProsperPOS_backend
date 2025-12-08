// Fix quotes status column
const mysql = require('mysql2/promise');

async function fixQuotesStatus() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('🔧 CORRIGIENDO COLUMNA STATUS EN QUOTES\n');

    // Verificar tipo actual
    const [columns] = await connection.query("SHOW COLUMNS FROM quotes LIKE 'status'");
    console.log('📋 Estructura actual de status:');
    console.table(columns);

    // Modificar a VARCHAR para soportar valores largos
    await connection.query(`
      ALTER TABLE quotes
      MODIFY COLUMN status VARCHAR(50) DEFAULT 'active'
      COMMENT 'Estado: active, converted_to_invoice, converted_to_pending, cancelled'
    `);

    console.log('\n✅ Columna status modificada a VARCHAR(50)');

    // Verificar cambio
    const [newColumns] = await connection.query("SHOW COLUMNS FROM quotes LIKE 'status'");
    console.log('\n📋 Nueva estructura de status:');
    console.table(newColumns);

    await connection.end();
    console.log('\n✅ CORRECCIÓN COMPLETADA\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fixQuotesStatus();
