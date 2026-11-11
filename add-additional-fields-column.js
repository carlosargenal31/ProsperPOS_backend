require('dotenv').config();
const db = require('./src/utils/database');

async function addAdditionalFieldsColumn() {
  try {
    console.log('Verificando si la columna additional_fields existe...');
    const columns = await db.query('DESCRIBE products');
    const hasColumn = columns.find(c => c.Field === 'additional_fields');

    if (hasColumn) {
      console.log('La columna additional_fields ya existe.');
      process.exit(0);
    }

    console.log('Agregando columna additional_fields a la tabla products...');
    await db.query(`
      ALTER TABLE products
      ADD COLUMN additional_fields JSON NULL
      AFTER estilo
    `);

    console.log('Columna additional_fields agregada exitosamente.');
    console.log('Esta columna permitirá almacenar campos adicionales personalizados para los productos.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addAdditionalFieldsColumn();
