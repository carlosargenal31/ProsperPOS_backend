const db = require('../src/utils/database');

async function insertResolutionData() {
  try {
    console.log('Insertando datos de resolución...\n');

    // Verificar si ya existe
    const existing = await db.query('SELECT * FROM resolutions WHERE numero_resolucion = ?', [
      '2A9170-F8828A-8815E0-63BE03-090956-9D'
    ]);

    if (existing.length > 0) {
      console.log('✓ La resolución ya existe en la base de datos');
    } else {
      // Insertar nueva resolución
      await db.query(`
        INSERT INTO resolutions (
          numero_resolucion,
          cai,
          prefijo_control,
          fecha_inicio,
          fecha_fin,
          nro_inicial_control,
          nro_final_control,
          nro_actual_control,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        '2A9170-F8828A-8815E0-63BE03-090956-9D',
        '2A9170-F8828A-8815E0-63BE03-090956-9D',
        '000-002-01-',
        '2025-01-01',
        '2025-12-31',
        30001,
        40000,
        31792,
        1
      ]);

      console.log('✓ Resolución insertada exitosamente');
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

insertResolutionData();
