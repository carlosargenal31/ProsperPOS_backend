require('dotenv').config();
const db = require('./src/utils/database');

async function updateSessionTypeToArqueo() {
  try {
    await db.connectDatabase();
    console.log('🔄 Actualizando session_type a ARQUEO...');

    // Actualizar todos los registros existentes a tipo ARQUEO
    const result = await db.query(`
      UPDATE cash_register_sessions
      SET session_type = 'ARQUEO'
      WHERE session_type IN ('APERTURA', 'CIERRE') OR session_type IS NULL
    `);

    console.log(`✓ ${result.affectedRows} registros actualizados a tipo ARQUEO`);

    // Actualizar consecutivos de AP- y CI- a ARQ-
    const sessions = await db.query(`
      SELECT id, consecutive
      FROM cash_register_sessions
      WHERE consecutive LIKE 'AP-%' OR consecutive LIKE 'CI-%'
    `);

    console.log(`\n🔄 Actualizando ${sessions.length} consecutivos...`);

    for (const session of sessions) {
      const newConsecutive = session.consecutive.replace(/^(AP|CI)-/, 'ARQ-');
      await db.query(
        'UPDATE cash_register_sessions SET consecutive = ? WHERE id = ?',
        [newConsecutive, session.id]
      );
      console.log(`  ${session.consecutive} → ${newConsecutive}`);
    }

    console.log('\n✅ Actualización completada exitosamente');
    console.log('📋 Todos los arqueos ahora son de tipo ARQUEO');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateSessionTypeToArqueo();
