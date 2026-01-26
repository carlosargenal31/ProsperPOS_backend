require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prosperpos'
};

async function updateBorradorToProcesado() {
  let connection;

  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);

    // Listar todos los triggers de la tabla cargo_descargo
    console.log('Listando triggers de la tabla cargo_descargo...');
    const [triggers] = await connection.query(`
      SELECT TRIGGER_NAME
      FROM information_schema.TRIGGERS
      WHERE EVENT_OBJECT_TABLE = 'cargo_descargo'
      AND EVENT_OBJECT_SCHEMA = DATABASE()
    `);

    if (triggers.length > 0) {
      console.log('Triggers encontrados:');
      for (const trigger of triggers) {
        console.log(`  - ${trigger.TRIGGER_NAME}`);
        try {
          await connection.query(`DROP TRIGGER IF EXISTS ${trigger.TRIGGER_NAME}`);
          console.log(`    ✓ Eliminado`);
        } catch (error) {
          console.log(`    ✗ Error: ${error.message}`);
        }
      }
    } else {
      console.log('No se encontraron triggers.');
    }

    console.log('\nActualizando registros de BORRADOR a PROCESADO...');

    // Actualizar todos los registros con estado BORRADOR a PROCESADO
    const [result] = await connection.execute(
      `UPDATE cargo_descargo
       SET status = 'PROCESADO'
       WHERE status = 'BORRADOR'`
    );

    console.log(`✓ ${result.affectedRows} registros actualizados de BORRADOR a PROCESADO`);

    // Verificar que no queden registros con BORRADOR
    const [check] = await connection.execute(
      `SELECT COUNT(*) as count FROM cargo_descargo WHERE status = 'BORRADOR'`
    );

    console.log(`✓ Registros con BORRADOR restantes: ${check[0].count}`);

    // Mostrar el nuevo conteo de estados
    const [statusCount] = await connection.execute(
      `SELECT status, COUNT(*) as count
       FROM cargo_descargo
       GROUP BY status`
    );

    console.log('\nConteo de registros por estado:');
    statusCount.forEach(row => {
      console.log(`  - ${row.status}: ${row.count}`);
    });

    console.log('\n✓ Migración completada exitosamente');

  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar la migración
updateBorradorToProcesado();
