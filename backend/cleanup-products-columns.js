// ===================================================================
// MIGRACIÓN: Limpiar columnas redundantes de productos
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
    console.log('🔄 Limpiando columnas redundantes de tabla products...\n');

    // 1. Eliminar columna tax_rate (ahora usamos tax_id)
    console.log('🗑️  Eliminando columna tax_rate...');
    const [taxRateCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'tax_rate'`);
    if (taxRateCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN tax_rate`);
      console.log('✅ Columna tax_rate eliminada\n');
    } else {
      console.log('✅ Columna tax_rate ya estaba eliminada\n');
    }

    // 2. Eliminar columna tax_rate_id (ahora usamos tax_id)
    console.log('🗑️  Eliminando columna tax_rate_id...');
    const [taxRateIdCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'tax_rate_id'`);
    if (taxRateIdCol.length > 0) {
      // Primero eliminar el foreign key si existe
      const [fks] = await connection.execute(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'tax_rate_id'
        AND CONSTRAINT_NAME != 'PRIMARY'
      `);

      for (const fk of fks) {
        console.log(`  - Eliminando foreign key ${fk.CONSTRAINT_NAME}...`);
        await connection.execute(`ALTER TABLE products DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
      }

      await connection.execute(`ALTER TABLE products DROP COLUMN tax_rate_id`);
      console.log('✅ Columna tax_rate_id eliminada\n');
    } else {
      console.log('✅ Columna tax_rate_id ya estaba eliminada\n');
    }

    // 3. Eliminar columna status (ahora solo usamos is_active)
    console.log('🗑️  Eliminando columna status...');
    const [statusCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'status'`);
    if (statusCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN status`);
      console.log('✅ Columna status eliminada\n');
    } else {
      console.log('✅ Columna status ya estaba eliminada\n');
    }

    // 4. Verificar estructura final
    console.log('📊 Verificando estructura final...');
    const [columns] = await connection.execute(`SHOW COLUMNS FROM products`);

    const hasTaxRate = columns.some(col => col.Field === 'tax_rate');
    const hasTaxRateId = columns.some(col => col.Field === 'tax_rate_id');
    const hasStatus = columns.some(col => col.Field === 'status');
    const hasIsActive = columns.some(col => col.Field === 'is_active');
    const hasTaxId = columns.some(col => col.Field === 'tax_id');

    console.log(`  - Columna "tax_rate": ${hasTaxRate ? '❌ EXISTE (debería eliminarse)' : '✅ NO EXISTE'}`);
    console.log(`  - Columna "tax_rate_id": ${hasTaxRateId ? '❌ EXISTE (debería eliminarse)' : '✅ NO EXISTE'}`);
    console.log(`  - Columna "status": ${hasStatus ? '❌ EXISTE (debería eliminarse)' : '✅ NO EXISTE'}`);
    console.log(`  - Columna "is_active": ${hasIsActive ? '✅ EXISTE' : '❌ NO EXISTE (necesaria)'}`);
    console.log(`  - Columna "tax_id": ${hasTaxId ? '✅ EXISTE' : '❌ NO EXISTE (necesaria)'}`);
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
