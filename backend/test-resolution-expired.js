// ===================================================================
// PROSPERPOS - PRUEBA DE RESOLUCIÓN VENCIDA
// ===================================================================

const db = require('./src/utils/database');

async function testResolutionExpired() {
  try {
    console.log('🔍 Verificando resoluciones en la base de datos...\n');

    // 1. Ver todas las resoluciones
    const allResolutions = await db.query(`
      SELECT id, numero_resolucion, fecha_inicio, fecha_fin, is_active,
             nro_actual_control, deleted_at
      FROM resolutions
      ORDER BY created_at DESC
    `);

    console.log('📋 Todas las resoluciones:');
    console.table(allResolutions);

    // 2. Probar endpoint de resolución activa (simulado)
    console.log('\n🔍 Probando lógica de resolución activa...\n');

    const query = `
      SELECT * FROM resolutions
      WHERE is_active = 1
      AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const resolutions = await db.query(query);

    if (!resolutions || resolutions.length === 0) {
      console.log('❌ No hay resolución activa disponible');
      process.exit(0);
    }

    const resolution = resolutions[0];
    console.log('✅ Resolución encontrada:');
    console.log('   Número:', resolution.numero_resolucion);
    console.log('   Fecha inicio:', resolution.fecha_inicio);
    console.log('   Fecha fin:', resolution.fecha_fin);
    console.log('   Activa:', resolution.is_active);

    // 3. Verificar si está vencida
    const currentDate = new Date();
    const endDate = new Date(resolution.fecha_fin);
    const isExpired = currentDate > endDate;

    console.log('\n⏰ Verificación de vencimiento:');
    console.log('   Fecha actual:', currentDate.toISOString().split('T')[0]);
    console.log('   Fecha fin:', endDate.toISOString().split('T')[0]);
    console.log('   ¿Está vencida?:', isExpired ? '❌ SÍ' : '✅ NO');

    if (isExpired) {
      console.log('\n⚠️  LA RESOLUCIÓN ESTÁ VENCIDA');
      console.log('   El sistema bloqueará la facturación');
    } else {
      const daysUntilExpiration = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
      console.log('\n✅ La resolución está vigente');
      console.log('   Días hasta vencimiento:', daysUntilExpiration);
    }

    // 4. Resultado final
    console.log('\n📊 Respuesta simulada del endpoint:');
    const responseData = {
      ...resolution,
      is_expired: isExpired,
      days_until_expiration: isExpired ? 0 : Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24))
    };
    console.log(JSON.stringify(responseData, null, 2));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testResolutionExpired();
