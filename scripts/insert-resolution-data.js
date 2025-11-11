// ===================================================================
// PROSPERPOS - SCRIPT PARA INSERTAR DATOS DE RESOLUCIONES
// ===================================================================

const db = require('../src/utils/database');

async function insertResolutionData() {
  try {
    console.log('Insertando datos de resoluciones...\n');

    // Insertar resolución desde CSV
    const insertQuery = `
      INSERT INTO resolutions (
        id,
        numero_resolucion,
        prefijo_control,
        fecha_inicio,
        fecha_fin,
        is_active,
        notas,
        nro_inicial_control,
        nro_final_control,
        nro_actual_control,
        sufijo_control,
        nro_critico,
        alertar_dias_antes,
        alertar_porcentaje_uso,
        alertar_en_nro_control
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        numero_resolucion = VALUES(numero_resolucion),
        prefijo_control = VALUES(prefijo_control),
        fecha_inicio = VALUES(fecha_inicio),
        fecha_fin = VALUES(fecha_fin),
        is_active = VALUES(is_active),
        nro_inicial_control = VALUES(nro_inicial_control),
        nro_final_control = VALUES(nro_final_control),
        nro_actual_control = VALUES(nro_actual_control),
        sufijo_control = VALUES(sufijo_control),
        nro_critico = VALUES(nro_critico),
        alertar_dias_antes = VALUES(alertar_dias_antes),
        alertar_porcentaje_uso = VALUES(alertar_porcentaje_uso),
        alertar_en_nro_control = VALUES(alertar_en_nro_control)
    `;

    const values = [
      1,
      '2A9170-F8828A-8815E0-63BE03-090956-9D',
      '0',
      '2024-12-31',  // Convertido de 31/12/2024
      '2025-12-31',  // Convertido de 31/12/2025
      1,             // Activa
      null,
      30001,
      40000,
      30001,
      '002-01',
      0,
      6,
      99,
      0
    ];

    await db.query(insertQuery, values);
    console.log('✓ Datos insertados correctamente\n');

    // Verificar inserción
    const result = await db.query('SELECT * FROM resolutions WHERE id = 1');

    if (result && result.length > 0) {
      console.log('Resolución insertada:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('ID:                   ', result[0].id);
      console.log('Número Resolución:    ', result[0].numero_resolucion);
      console.log('Prefijo Control:      ', result[0].prefijo_control);
      console.log('Fecha Inicio:         ', result[0].fecha_inicio);
      console.log('Fecha Fin:            ', result[0].fecha_fin);
      console.log('Estado:               ', result[0].is_active ? 'ACTIVA' : 'INACTIVA');
      console.log('Nro. Inicial:         ', result[0].nro_inicial_control);
      console.log('Nro. Final:           ', result[0].nro_final_control);
      console.log('Nro. Actual:          ', result[0].nro_actual_control);
      console.log('Sufijo Control:       ', result[0].sufijo_control);
      console.log('Nro. Crítico:         ', result[0].nro_critico);
      console.log('Alertar Días Antes:   ', result[0].alertar_dias_antes);
      console.log('Alertar % Uso:        ', result[0].alertar_porcentaje_uso);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al insertar datos:', error.message);
    console.error(error);
    process.exit(1);
  }
}

insertResolutionData();
