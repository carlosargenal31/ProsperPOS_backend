// Fix resolution prefix format
const mysql = require('mysql2/promise');

async function fixResolutionPrefix() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('🔧 CORRIGIENDO FORMATO DE RESOLUCIÓN\n');

    // Actualizar el formato correcto
    await connection.query(`
      UPDATE resolutions
      SET prefijo_control = '000-002-01-',
          sufijo_control = NULL
      WHERE id = 1
    `);

    console.log('✅ Resolución actualizada\n');

    // Verificar cambio
    const [resolutions] = await connection.query(`
      SELECT id, numero_resolucion, prefijo_control, sufijo_control, nro_actual_control
      FROM resolutions
      WHERE id = 1
    `);

    console.log('📋 Resolución actualizada:');
    console.table(resolutions);

    const res = resolutions[0];
    const prefix = (res.prefijo_control || '') + (res.sufijo_control || '');
    const invoiceNumber = `${prefix}${String(res.nro_actual_control).padStart(8, '0')}`;

    console.log('\n✅ Formato correcto:');
    console.log(`   - Prefijo: "${res.prefijo_control}"`);
    console.log(`   - Sufijo: ${res.sufijo_control === null ? 'NULL' : `"${res.sufijo_control}"`}`);
    console.log(`   - Número completo: ${invoiceNumber}`);
    console.log(`\n🎉 Próxima factura: ${invoiceNumber}\n`);

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fixResolutionPrefix();
