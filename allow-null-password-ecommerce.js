// Script para permitir password NULL en la tabla ecommerce_customers (para OAuth)
require('dotenv').config();
const db = require('./src/utils/database');

async function allowNullPasswordEcommerce() {
  try {
    console.log('🔧 Modificando columna password para permitir NULL en ecommerce_customers...');

    await db.query(`
      ALTER TABLE ecommerce_customers
      MODIFY COLUMN password VARCHAR(255) NULL
    `);

    console.log('✅ Columna password modificada exitosamente');
    console.log('   Ahora los clientes de Google OAuth pueden tener password NULL');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al modificar columna:', error);
    process.exit(1);
  }
}

allowNullPasswordEcommerce();
