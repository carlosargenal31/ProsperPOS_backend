/**
 * Migración: Agregar configuración de tienda en línea a tabla companies
 * Agrega columna allow_order_without_stock para permitir pedidos sin importar el stock
 */

// Cargar variables de entorno
require('dotenv').config();

const db = require('./src/utils/database');
const logger = require('./src/utils/logger');

async function addEcommerceConfigToCompanies() {
  try {
    console.log('🚀 Iniciando migración: Agregar configuración de e-commerce a companies...');

    // Verificar si la columna ya existe
    const columns = await db.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'companies'
        AND COLUMN_NAME = 'allow_order_without_stock'
    `);

    if (columns && columns.length > 0) {
      console.log('⚠️  La columna allow_order_without_stock ya existe en la tabla companies');
      process.exit(0);
    }

    // Agregar columna allow_order_without_stock
    console.log('📝 Agregando columna allow_order_without_stock...');
    await db.execute(`
      ALTER TABLE companies
      ADD COLUMN allow_order_without_stock TINYINT(1) DEFAULT 0
      COMMENT 'Permite pedidos en tienda online sin validar stock disponible'
      AFTER logo_url
    `);

    console.log('✅ Columna allow_order_without_stock agregada exitosamente');

    // Verificar que se agregó correctamente
    const verification = await db.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'companies'
        AND COLUMN_NAME = 'allow_order_without_stock'
    `);

    console.log('✅ Verificación de columna:');
    console.log(JSON.stringify(verification, null, 2));

    console.log('✅ Migración completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
addEcommerceConfigToCompanies();
