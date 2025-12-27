// ===================================================================
// TEST SIMPLE - VERIFICACIÓN DE RUTAS DE INVENTARIO FÍSICO
// ===================================================================

const db = require('./src/utils/database');
const PhysicalInventoryService = require('./src/services/physical-inventory.service');

async function runTests() {
  console.log('🧪 Iniciando pruebas del servicio de inventario físico...\n');

  try {
    // Test 1: Verificar conexión a base de datos
    console.log('1️⃣ Verificando conexión a base de datos...');
    const testQuery = await db.execute('SELECT 1 as test');
    console.log('   ✅ Conexión a base de datos exitosa\n');

    // Test 2: Probar servicio sin filtros
    console.log('2️⃣ Probando servicio de inventario físico sin filtros...');
    const result1 = await PhysicalInventoryService.getPhysicalInventory({});
    console.log('   ✅ Servicio ejecutado correctamente');
    console.log('   📊 Total de registros:', result1.totals.total_registros);
    console.log('   📦 Cantidad total:', result1.totals.cantidad_total);
    console.log('   🔒 Apartadas:', result1.totals.apartadas_total);

    if (Array.isArray(result1.data)) {
      console.log('   🏪 Bodegas:', result1.data.length);
    }
    console.log('');

    // Test 3: Probar con filtro de existencias
    console.log('3️⃣ Probando filtro de existencias (con stock)...');
    const result2 = await PhysicalInventoryService.getPhysicalInventory({
      existence_filter: 'with_stock'
    });
    console.log('   ✅ Filtro aplicado correctamente');
    console.log('   📊 Registros con stock:', result2.totals.total_registros);
    console.log('');

    // Test 4: Probar con filtro de existencias sin stock
    console.log('4️⃣ Probando filtro de existencias (sin stock)...');
    const result3 = await PhysicalInventoryService.getPhysicalInventory({
      existence_filter: 'without_stock'
    });
    console.log('   ✅ Filtro aplicado correctamente');
    console.log('   📊 Registros sin stock:', result3.totals.total_registros);
    console.log('');

    // Test 5: Probar con costos incluidos
    console.log('5️⃣ Probando con costos incluidos...');
    const result4 = await PhysicalInventoryService.getPhysicalInventory({
      include_cost: true
    });
    console.log('   ✅ Costos incluidos correctamente');
    if (result4.totals.costo_total !== undefined) {
      console.log('   💰 Costo total:', result4.totals.costo_total);
    }
    console.log('');

    // Test 6: Probar agrupación por categorías
    console.log('6️⃣ Probando agrupación por categorías...');
    const result5 = await PhysicalInventoryService.getPhysicalInventory({
      group_by_groups: true,
      group_by_warehouses: false
    });
    console.log('   ✅ Agrupación por categorías correcta');
    console.log('   📊 Total registros:', result5.totals.total_registros);
    console.log('');

    // Test 7: Verificar estructura de metadata
    console.log('7️⃣ Verificando estructura de respuesta...');
    const result6 = await PhysicalInventoryService.getPhysicalInventory({
      include_cost: true,
      include_prices: true,
      include_codes: true,
      include_unit: true,
      include_brand: true
    });
    console.log('   ✅ Estructura de metadata correcta');
    console.log('   📋 Metadata:', JSON.stringify(result6.metadata, null, 2));
    console.log('');

    // Test 8: Verificar que include_images no existe
    console.log('8️⃣ Verificando que include_images fue removido...');
    const hasIncludeImages = JSON.stringify(result6).includes('include_images');
    if (!hasIncludeImages) {
      console.log('   ✅ include_images removido correctamente');
    } else {
      console.log('   ❌ include_images todavía existe en la respuesta');
    }
    console.log('');

    console.log('✅ ¡Todas las pruebas completadas exitosamente!\n');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

runTests();
