const db = require('../src/utils/database');

(async () => {
  try {
    const resolutions = await db.query('SELECT * FROM resolutions LIMIT 5');
    console.log('\n=== RESOLUCIONES EN LA BASE DE DATOS ===\n');
    console.log('Total:', resolutions.length);
    console.log('\n');

    resolutions.forEach((r, i) => {
      console.log(`Resolución ${i + 1}:`);
      console.log('  ID:', r.id);
      console.log('  Número:', r.numero_resolucion);
      console.log('  Prefijo:', r.prefijo_control);
      console.log('  Fecha Inicio:', r.fecha_inicio);
      console.log('  Fecha Fin:', r.fecha_fin);
      console.log('  Activo:', r.is_active);
      console.log('  Nro Inicial:', r.nro_inicial_control);
      console.log('  Nro Final:', r.nro_final_control);
      console.log('  Nro Actual:', r.nro_actual_control);
      console.log('  Sufijo:', r.sufijo_control);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
