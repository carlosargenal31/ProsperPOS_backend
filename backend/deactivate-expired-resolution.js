// ===================================================================
// PROSPERPOS - DESACTIVAR RESOLUCIÓN VENCIDA
// ===================================================================

require('dotenv').config();
const mysql = require('mysql2/promise');

async function deactivateExpiredResolution() {
  let connection;

  try {
    // Crear conexión directa
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado a la base de datos\n');

    // 1. Ver todas las resoluciones activas
    const [activeResolutions] = await connection.query(`
      SELECT id, numero_resolucion, fecha_inicio, fecha_fin, is_active
      FROM resolutions
      WHERE is_active = 1 AND deleted_at IS NULL
    `);

    console.log('📋 Resoluciones activas actuales:');
    console.table(activeResolutions);

    if (activeResolutions.length === 0) {
      console.log('\n⚠️  No hay resoluciones activas');
      await connection.end();
      process.exit(0);
    }

    // 2. Verificar cuáles están vencidas
    const today = new Date();
    console.log('\n📅 Fecha actual:', today.toISOString().split('T')[0]);

    for (const resolution of activeResolutions) {
      const endDate = new Date(resolution.fecha_fin);
      const isExpired = today > endDate;

      console.log(`\n🔍 Resolución ${resolution.numero_resolucion}:`);
      console.log(`   Fecha fin: ${endDate.toISOString().split('T')[0]}`);
      console.log(`   Estado: ${isExpired ? '❌ VENCIDA' : '✅ VIGENTE'}`);

      if (isExpired) {
        console.log(`   ⚡ Desactivando resolución vencida...`);

        await connection.query(`
          UPDATE resolutions
          SET is_active = 0
          WHERE id = ?
        `, [resolution.id]);

        console.log(`   ✅ Resolución ${resolution.numero_resolucion} desactivada`);
      }
    }

    // 3. Mostrar estado final
    const [finalResolutions] = await connection.query(`
      SELECT id, numero_resolucion, fecha_inicio, fecha_fin, is_active
      FROM resolutions
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);

    console.log('\n📊 Estado final de todas las resoluciones:');
    console.table(finalResolutions);

    await connection.end();
    console.log('\n✅ Proceso completado');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

deactivateExpiredResolution();
