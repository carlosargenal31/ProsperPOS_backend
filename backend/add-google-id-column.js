// ===================================================================
// PROSPERPOS - MIGRACIÓN: Agregar columna google_id a users
// ===================================================================

require('dotenv').config();
const db = require('./src/utils/database');

async function addGoogleIdColumn() {
  try {
    console.log('Iniciando migración: Agregar columna google_id a users...');

    // Verificar si la columna ya existe
    const columns = await db.query(`
      SHOW COLUMNS FROM users LIKE 'google_id'
    `);

    if (columns.length > 0) {
      console.log('✓ La columna google_id ya existe en la tabla users');
      process.exit(0);
    }

    // Agregar columna google_id
    await db.query(`
      ALTER TABLE users
      ADD COLUMN google_id VARCHAR(255) NULL AFTER email,
      ADD UNIQUE KEY idx_google_id (google_id)
    `);

    console.log('✓ Columna google_id agregada exitosamente a la tabla users');
    console.log('✓ Índice único creado en google_id');

    process.exit(0);

  } catch (error) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

addGoogleIdColumn();
