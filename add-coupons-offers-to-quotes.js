require('dotenv').config();
const db = require('./src/utils/database');

async function addColumnsToQuotes() {
  try {
    console.log('Agregando columnas a la tabla quotes...');

    // Agregar columna discount_type
    try {
      await db.query(`
        ALTER TABLE quotes
        ADD COLUMN discount_type VARCHAR(50) NULL AFTER discount
      `);
      console.log('✅ Columna discount_type agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Columna discount_type ya existe');
      } else {
        throw error;
      }
    }

    // Agregar columna discount_value
    try {
      await db.query(`
        ALTER TABLE quotes
        ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT 0 AFTER discount_type
      `);
      console.log('✅ Columna discount_value agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Columna discount_value ya existe');
      } else {
        throw error;
      }
    }

    // Agregar columna applied_coupons
    try {
      await db.query(`
        ALTER TABLE quotes
        ADD COLUMN applied_coupons JSON NULL AFTER surcharge
      `);
      console.log('✅ Columna applied_coupons agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Columna applied_coupons ya existe');
      } else {
        throw error;
      }
    }

    // Agregar columna applied_offers
    try {
      await db.query(`
        ALTER TABLE quotes
        ADD COLUMN applied_offers JSON NULL AFTER applied_coupons
      `);
      console.log('✅ Columna applied_offers agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Columna applied_offers ya existe');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

addColumnsToQuotes();
