// Check resolution prefix
const mysql = require('mysql2/promise');

async function checkResolution() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('🔍 VERIFICANDO RESOLUCIÓN ACTIVA\n');

    const [resolutions] = await connection.query(`
      SELECT id, numero_resolucion, prefijo_control, sufijo_control, nro_actual_control
      FROM resolutions
      WHERE is_active = 1 AND deleted_at IS NULL
    `);

    if (resolutions.length === 0) {
      console.log('❌ No hay resolución activa');
    } else {
      console.log('📋 Resolución activa:');
      console.table(resolutions);

      const res = resolutions[0];
      const prefix = (res.prefijo_control || '') + (res.sufijo_control || '');
      const invoiceNumber = `${prefix}${String(res.nro_actual_control).padStart(8, '0')}`;

      console.log('\n📝 Datos:');
      console.log(`   - Prefijo: "${res.prefijo_control}"`);
      console.log(`   - Sufijo: "${res.sufijo_control}"`);
      console.log(`   - Combinado: "${prefix}"`);
      console.log(`   - Consecutivo: ${res.nro_actual_control}`);
      console.log(`   - Número completo: ${invoiceNumber}`);

      console.log('\n🔧 El formato correcto debe ser: 000-002-01-');
      console.log('   ¿Necesitas actualizar la resolución? (prefijo_control = "000-002-01-", sufijo_control = NULL)');
    }

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

checkResolution();
