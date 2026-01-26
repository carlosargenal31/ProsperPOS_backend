require('dotenv').config();
const db = require('./src/utils/database');

async function fixArqueoDate() {
  try {
    await db.connectDatabase();
    console.log('🔄 Corrigiendo fecha del arqueo...');

    // Actualizar la fecha del arqueo a 2026-01-20
    await db.query(`
      UPDATE cash_register_sessions
      SET date_from = '2026-01-20',
          time_from = '08:39:00'
      WHERE id = 5
    `);

    console.log('✅ Fecha del arqueo actualizada a 2026-01-20 08:39:00');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixArqueoDate();
