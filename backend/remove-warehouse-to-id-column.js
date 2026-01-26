const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeWarehouseToIdColumn() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('Conectado a la base de datos');

    // Verificar si la columna existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'cargo_descargo'
        AND COLUMN_NAME = 'warehouse_to_id'
    `, [process.env.DB_NAME || 'prosperpos']);

    if (columns.length === 0) {
      console.log('La columna warehouse_to_id no existe en la tabla cargo_descargo');
      return;
    }

    console.log('Eliminando foreign key constraint...');

    // Primero eliminar la foreign key constraint
    await connection.query(`
      ALTER TABLE cargo_descargo
      DROP FOREIGN KEY cargo_descargo_ibfk_2
    `);

    console.log('✓ Foreign key eliminada');

    console.log('Eliminando columna warehouse_to_id de la tabla cargo_descargo...');

    // Ahora eliminar la columna
    await connection.query(`
      ALTER TABLE cargo_descargo
      DROP COLUMN warehouse_to_id
    `);

    console.log('✓ Columna warehouse_to_id eliminada exitosamente');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

removeWarehouseToIdColumn()
  .then(() => {
    console.log('\n=== Migración completada ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== Error en la migración ===');
    console.error(error);
    process.exit(1);
  });
