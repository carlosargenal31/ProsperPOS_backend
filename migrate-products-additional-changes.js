// ===================================================================
// MIGRACIÓN: Modificaciones adicionales en tabla products
// ===================================================================
// Cambios:
// 1. Eliminar columna barcode
// 2. Eliminar columna previous_cost
// 3. Eliminar columna average_cost
// 4. Eliminar columna hashtags
// 5. Agregar columna show_in_online_store (BOOLEAN)
// 6. Agregar columna supplier_id (INT)
// 7. Asegurar que existe columna weight (DECIMAL)

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
    console.log('🔄 Iniciando migración adicional de tabla products...\n');

    // 1. Eliminar columna barcode
    console.log('🗑️  Verificando columna barcode...');
    const [barcodeCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'barcode'`);
    if (barcodeCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN barcode`);
      console.log('✅ Columna barcode eliminada\n');
    } else {
      console.log('✅ Columna barcode ya estaba eliminada\n');
    }

    // 2. Eliminar columna previous_cost
    console.log('🗑️  Verificando columna previous_cost...');
    const [prevCostCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'previous_cost'`);
    if (prevCostCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN previous_cost`);
      console.log('✅ Columna previous_cost eliminada\n');
    } else {
      console.log('✅ Columna previous_cost ya estaba eliminada\n');
    }

    // 3. Eliminar columna average_cost
    console.log('🗑️  Verificando columna average_cost...');
    const [avgCostCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'average_cost'`);
    if (avgCostCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN average_cost`);
      console.log('✅ Columna average_cost eliminada\n');
    } else {
      console.log('✅ Columna average_cost ya estaba eliminada\n');
    }

    // 4. Eliminar columna hashtags
    console.log('🗑️  Verificando columna hashtags...');
    const [hashtagsCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'hashtags'`);
    if (hashtagsCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN hashtags`);
      console.log('✅ Columna hashtags eliminada\n');
    } else {
      console.log('✅ Columna hashtags ya estaba eliminada\n');
    }

    // 5. Agregar columna show_in_online_store
    console.log('📝 Verificando columna show_in_online_store...');
    const [showOnlineCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'show_in_online_store'`);
    if (showOnlineCol.length === 0) {
      await connection.execute(`
        ALTER TABLE products
        ADD COLUMN show_in_online_store BOOLEAN DEFAULT FALSE AFTER description
      `);
      console.log('✅ Columna show_in_online_store agregada (default: FALSE)\n');
    } else {
      console.log('✅ Columna show_in_online_store ya existe\n');
    }

    // 6. Agregar columna supplier_id
    console.log('📝 Verificando columna supplier_id...');
    const [supplierCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'supplier_id'`);
    if (supplierCol.length === 0) {
      await connection.execute(`
        ALTER TABLE products
        ADD COLUMN supplier_id INT NULL AFTER brand_id
      `);
      console.log('✅ Columna supplier_id agregada\n');
    } else {
      console.log('✅ Columna supplier_id ya existe\n');
    }

    // 7. Verificar columna weight
    console.log('📝 Verificando columna weight...');
    const [weightCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'weight'`);
    if (weightCol.length === 0) {
      await connection.execute(`
        ALTER TABLE products
        ADD COLUMN weight DECIMAL(10, 2) NULL AFTER description
      `);
      console.log('✅ Columna weight agregada\n');
    } else {
      console.log('✅ Columna weight ya existe\n');
    }

    // 8. Verificar estructura final
    console.log('📊 Verificando estructura final...');
    const [columns] = await connection.execute(`SHOW COLUMNS FROM products`);

    const hasBarcode = columns.some(col => col.Field === 'barcode');
    const hasPreviousCost = columns.some(col => col.Field === 'previous_cost');
    const hasAverageCost = columns.some(col => col.Field === 'average_cost');
    const hasHashtags = columns.some(col => col.Field === 'hashtags');
    const hasShowOnline = columns.some(col => col.Field === 'show_in_online_store');
    const hasSupplierId = columns.some(col => col.Field === 'supplier_id');
    const hasWeight = columns.some(col => col.Field === 'weight');

    console.log('\nVerificación:');
    console.log(`  - Columna "barcode": ${hasBarcode ? '❌ AÚN EXISTE' : '✅ ELIMINADA'}`);
    console.log(`  - Columna "previous_cost": ${hasPreviousCost ? '❌ AÚN EXISTE' : '✅ ELIMINADA'}`);
    console.log(`  - Columna "average_cost": ${hasAverageCost ? '❌ AÚN EXISTE' : '✅ ELIMINADA'}`);
    console.log(`  - Columna "hashtags": ${hasHashtags ? '❌ AÚN EXISTE' : '✅ ELIMINADA'}`);
    console.log(`  - Columna "show_in_online_store": ${hasShowOnline ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    console.log(`  - Columna "supplier_id": ${hasSupplierId ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    console.log(`  - Columna "weight": ${hasWeight ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    console.log('');

    // 9. Mostrar estadísticas de proveedores
    console.log('📊 Verificando tabla de proveedores...');
    const [suppliers] = await connection.execute(`
      SELECT COUNT(*) as count FROM suppliers
    `);
    console.log(`  - Total de proveedores en sistema: ${suppliers[0].count}`);
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
