// Script para probar el servicio completo de productos vendidos
require('dotenv').config();
const SoldItemsService = require('./src/services/sold-items.service');

async function testService() {
  try {
    console.log('=== Probando SoldItemsService ===\n');

    // Test 1: Consulta básica
    console.log('1. Probando consulta básica (últimos 30 días)...');
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);

    const filters1 = {
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
      include_categories: false,
      include_subcategories: false,
      include_brands: false,
      show_costs: false,
      show_utility: false
    };

    const result1 = await SoldItemsService.getSoldItems(filters1);
    console.log(`   ✓ Productos encontrados: ${result1.items.length}`);
    console.log(`   ✓ Total final: L ${result1.totals.total_final.toFixed(2)}`);

    // Test 2: Con categorías y marcas
    console.log('\n2. Probando con categorías y marcas...');
    const filters2 = {
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
      include_categories: true,
      include_subcategories: true,
      include_brands: true,
      show_costs: false,
      show_utility: false
    };

    const result2 = await SoldItemsService.getSoldItems(filters2);
    console.log(`   ✓ Productos encontrados: ${result2.items.length}`);
    if (result2.items.length > 0) {
      const item = result2.items[0];
      console.log(`   ✓ Primer producto: ${item.producto}`);
      if (item.categoria) console.log(`   ✓ Categoría: ${item.categoria}`);
      if (item.marca) console.log(`   ✓ Marca: ${item.marca}`);
    }

    // Test 3: Obtener productos
    console.log('\n3. Probando getProducts...');
    const products = await SoldItemsService.getProducts();
    console.log(`   ✓ Productos activos: ${products.length}`);

    // Test 4: Obtener categorías
    console.log('\n4. Probando getGroups (categorías)...');
    const categories = await SoldItemsService.getGroups();
    console.log(`   ✓ Categorías encontradas: ${categories.length}`);

    // Test 5: Obtener subcategorías
    console.log('\n5. Probando getSubgroups (subcategorías)...');
    const subcategories = await SoldItemsService.getSubgroups();
    console.log(`   ✓ Subcategorías encontradas: ${subcategories.length}`);

    console.log('\n✅ Todas las pruebas del servicio pasaron exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en el servicio:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testService();
