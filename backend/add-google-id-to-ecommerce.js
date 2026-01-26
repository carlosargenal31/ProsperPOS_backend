// Script para agregar google_id a ecommerce_customers
require('dotenv').config();
const db = require('./src/utils/database');

async function addGoogleIdColumn() {
  try {
    console.log('🔧 Agregando columna google_id a ecommerce_customers...');

    await db.query(`
      ALTER TABLE ecommerce_customers
      ADD COLUMN google_id VARCHAR(255) NULL AFTER email,
      ADD UNIQUE KEY idx_google_id (google_id)
    `);

    console.log('✅ Columna google_id agregada exitosamente');
    console.log('   Los usuarios de Google OAuth ahora pueden ser ecommerce customers');

    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ La columna google_id ya existe');
      process.exit(0);
    }
    console.error('❌ Error al agregar columna:', error);
    process.exit(1);
  }
}

addGoogleIdColumn();
