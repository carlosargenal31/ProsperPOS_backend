require('dotenv').config();
const db = require('./src/utils/database');

async function checkArqueos() {
  try {
    await db.connectDatabase();
    console.log('🔍 Verificando arqueos en la base de datos...\n');

    const sessions = await db.query(`
      SELECT id, consecutive, session_type, status, date_from, time_from, opening_amount
      FROM cash_register_sessions
      ORDER BY id DESC
    `);

    if (sessions.length === 0) {
      console.log('⚠️ No hay arqueos en la base de datos');
    } else {
      console.log(`📋 Total de arqueos: ${sessions.length}\n`);
      sessions.forEach(s => {
        console.log(`ID: ${s.id} | ${s.consecutive} | Tipo: ${s.session_type} | Estado: ${s.status}`);
        console.log(`   Fecha: ${s.date_from} ${s.time_from} | Apertura: L. ${s.opening_amount}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkArqueos();
