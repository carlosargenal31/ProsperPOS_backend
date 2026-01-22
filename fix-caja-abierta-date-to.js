const db = require('./src/utils/database');

async function fixCajaAbierta() {
  try {
    console.log('🔧 Corrigiendo cajas abiertas con date_to y time_to...\n');

    // Buscar cajas abiertas que tienen date_to o time_to
    const cajas = await db.query(`
      SELECT id, consecutive, status, date_from, time_from, date_to, time_to
      FROM cash_register_sessions
      WHERE status = 'ABIERTA'
      AND (date_to IS NOT NULL OR time_to IS NOT NULL)
    `);

    console.log(`📦 Encontradas ${cajas.length} cajas abiertas con fechas/horas de cierre\n`);

    if (cajas.length === 0) {
      console.log('✅ No hay cajas que corregir');
      return;
    }

    for (const caja of cajas) {
      console.log(`Caja: ${caja.consecutive}`);
      console.log(`  Estado: ${caja.status}`);
      console.log(`  Date_to: ${caja.date_to} (debe ser NULL)`);
      console.log(`  Time_to: ${caja.time_to} (debe ser NULL)`);

      // Limpiar date_to y time_to
      await db.query(`
        UPDATE cash_register_sessions
        SET date_to = NULL, time_to = NULL
        WHERE id = ?
      `, [caja.id]);

      console.log(`  ✅ Corregida\n`);
    }

    console.log('✅ Todas las cajas corregidas');

    // Verificar
    const verificacion = await db.query(`
      SELECT id, consecutive, status, date_to, time_to
      FROM cash_register_sessions
      WHERE status = 'ABIERTA'
    `);

    console.log('\n📊 VERIFICACIÓN FINAL:');
    verificacion.forEach(caja => {
      console.log(`  ${caja.consecutive}: date_to=${caja.date_to || 'NULL ✅'}, time_to=${caja.time_to || 'NULL ✅'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCajaAbierta();
