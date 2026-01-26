// ===================================================================
// MIGRACIÓN: Agregar columna tax_id a productos
// ===================================================================

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔄 Agregando columna tax_id a tabla products...\n');

    // Verificar si existe la columna tax_id
    console.log('📝 Verificando columna tax_id...');
    const [taxIdCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'tax_id'`);

    if (taxIdCol.length === 0) {
      await connection.execute(`
        ALTER TABLE products
        ADD COLUMN tax_id INT NULL AFTER show_in_online_store,
        ADD CONSTRAINT fk_products_tax_id FOREIGN KEY (tax_id) REFERENCES tax_rates(id) ON DELETE SET NULL
      `);
      console.log('✅ Columna tax_id agregada con foreign key\n');
    } else {
      console.log('✅ Columna tax_id ya existe\n');
    }

    // Verificar estructura final
    console.log('📊 Verificando estructura final...');
    const [columns] = await connection.execute(`SHOW COLUMNS FROM products`);
    const hasTaxId = columns.some(col => col.Field === 'tax_id');

    console.log(`  - Columna "tax_id": ${hasTaxId ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    console.log('');

    console.log('✅ Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar migración
migrate()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
