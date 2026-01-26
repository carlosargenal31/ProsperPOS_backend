require('dotenv').config();
const db = require('./src/utils/database');

async function alterSessionTypeEnum() {
  try {
    await db.connectDatabase();
    console.log('🔄 Modificando ENUM de session_type...');

    // Modificar el ENUM para incluir ARQUEO
    await db.query(`
      ALTER TABLE cash_register_sessions
      MODIFY COLUMN session_type ENUM('APERTURA', 'CIERRE', 'ARQUEO') DEFAULT 'ARQUEO'
    `);

    console.log('✅ ENUM actualizado: ahora incluye APERTURA, CIERRE y ARQUEO');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

alterSessionTypeEnum();
