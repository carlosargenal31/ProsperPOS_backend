// ===================================================================
// TEST - VERIFICAR QUERY DE INVENTARIO FÍSICO
// ===================================================================

const db = require('./src/utils/database');

async function testQuery() {
  console.log('🧪 Probando query de inventario físico...\n');

  try {
    // Test 1: Verificar estructura de tabla stock
    console.log('1️⃣ Verificando estructura de tabla stock...');
    const stockStructure = await db.execute('DESCRIBE stock');
    console.log('   Columnas de la tabla stock:');
    stockStructure.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    console.log('');

    // Test 2: Verificar que hay datos en stock
    console.log('2️⃣ Verificando datos en tabla stock...');
    const stockCount = await db.execute('SELECT COUNT(*) as total FROM stock');
    console.log(`   Total de registros en stock: ${stockCount[0].total}`);

    if (stockCount[0].total > 0) {
      const sampleStock = await db.execute('SELECT * FROM stock LIMIT 1');
      console.log('   Ejemplo de registro:');
      console.log(`   - product_id: ${sampleStock[0].product_id}`);
      console.log(`   - warehouse_id: ${sampleStock[0].warehouse_id}`);
      console.log(`   - quantity: ${sampleStock[0].quantity}`);
      console.log(`   - reserved_quantity: ${sampleStock[0].reserved_quantity}`);
    }
    console.log('');

    // Test 3: Probar la subconsulta de stock
    console.log('3️⃣ Probando subconsulta de stock...');
    const stockSubquery = `
      SELECT
        s.product_id,
        s.warehouse_id,
        COALESCE(s.quantity, 0) as stock_quantity,
        COALESCE(s.reserved_quantity, 0) as stock_quantity_reservada
      FROM stock s
      GROUP BY s.product_id, s.warehouse_id
      LIMIT 5
    `;

    const stockResults = await db.execute(stockSubquery);
    console.log(`   ✅ Subconsulta ejecutada correctamente (${stockResults.length} registros)`);
    if (stockResults.length > 0) {
      console.log('   Ejemplo de resultado:');
      console.log(`   - product_id: ${stockResults[0].product_id}`);
      console.log(`   - warehouse_id: ${stockResults[0].warehouse_id}`);
      console.log(`   - stock_quantity: ${stockResults[0].stock_quantity}`);
      console.log(`   - stock_quantity_reservada: ${stockResults[0].stock_quantity_reservada}`);
    }
    console.log('');

    // Test 4: Probar el query completo simplificado
    console.log('4️⃣ Probando query completo...');
    const fullQuery = `
      SELECT
        p.id,
        p.name as nombre,
        w.id as warehouse_id,
        w.nombre as almacen,
        COALESCE(stock_data.stock_quantity, 0) as cantidad,
        COALESCE(stock_data.stock_quantity_reservada, 0) as apartadas
      FROM products p
      CROSS JOIN warehouses w
      LEFT JOIN (
        SELECT
          s.product_id,
          s.warehouse_id,
          COALESCE(s.quantity, 0) as stock_quantity,
          COALESCE(s.reserved_quantity, 0) as stock_quantity_reservada
        FROM stock s
        GROUP BY s.product_id, s.warehouse_id
      ) stock_data ON stock_data.product_id = p.id AND stock_data.warehouse_id = w.id
      WHERE p.deleted_at IS NULL AND p.status = 'active'
      LIMIT 10
    `;

    const fullResults = await db.execute(fullQuery, ['active']);
    console.log(`   ✅ Query completo ejecutado correctamente (${fullResults.length} registros)`);
    if (fullResults.length > 0) {
      console.log('   Ejemplos de resultados:');
      fullResults.slice(0, 3).forEach((row, idx) => {
        console.log(`   ${idx + 1}. ${row.nombre} (${row.almacen}): ${row.cantidad} unidades, ${row.apartadas} apartadas`);
      });
    }
    console.log('');

    console.log('✅ Todas las pruebas del query completadas exitosamente!\n');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testQuery();
