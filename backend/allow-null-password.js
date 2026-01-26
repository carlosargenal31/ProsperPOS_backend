// Script para permitir password NULL en la tabla users (para OAuth)
require('dotenv').config();
const db = require('./src/utils/database');

async function allowNullPassword() {
  try {
    console.log('🔧 Modificando columna password para permitir NULL...');

    await db.query(`
      ALTER TABLE users
      MODIFY COLUMN password VARCHAR(255) NULL
    `);

    console.log('✅ Columna password modificada exitosamente');
    console.log('   Ahora los usuarios de Google OAuth pueden tener password NULL');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al modificar columna:', error);
    process.exit(1);
  }
}

allowNullPassword();
