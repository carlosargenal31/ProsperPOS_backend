require('dotenv').config();
const db = require('./src/utils/database');

async function addRevisadoStatus() {
  try {
    await db.connectDatabase();
    console.log('Agregando estado REVISADO a cash_register_sessions...');

    await db.query(`
      ALTER TABLE cash_register_sessions
      MODIFY COLUMN status ENUM('ABIERTA', 'CERRADA', 'CANCELADA', 'REVISADO') DEFAULT 'ABIERTA'
    `);

    console.log('✓ Estado REVISADO agregado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

addRevisadoStatus();
