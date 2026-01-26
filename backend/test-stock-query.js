// Test script to verify stock query with store_id
const InventoryAdjustmentService = require('./src/services/inventory-adjustment.service');

async function testStockQuery() {
  try {
    console.log('Testing stock query with store_id...\n');

    // Test 1: Without store_id
    console.log('=== Test 1: Without store_id ===');
    const result1 = await InventoryAdjustmentService.getInventoryForAdjustment({
      warehouse_id: 1,
      existence_filter: 'all'
    });
    console.log(`Found ${result1.length} products`);
    if (result1.length > 0) {
      console.log('Sample:', {
        producto: result1[0].producto,
        exist_teorica: result1[0].exist_teorica
      });
    }
    console.log('');

    // Test 2: With store_id
    console.log('=== Test 2: With store_id = 1 ===');
    const result2 = await InventoryAdjustmentService.getInventoryForAdjustment({
      warehouse_id: 1,
      store_id: 1,
      existence_filter: 'all'
    });
    console.log(`Found ${result2.length} products`);
    if (result2.length > 0) {
      const menorca = result2.find(p => p.producto && p.producto.toLowerCase().includes('menorca'));
      if (menorca) {
        console.log('Menorca Azul:', {
          producto: menorca.producto,
          exist_teorica: menorca.exist_teorica,
          bodega: menorca.bodega
        });
      } else {
        console.log('Sample:', {
          producto: result2[0].producto,
          exist_teorica: result2[0].exist_teorica
        });
      }
    }
    console.log('');

    console.log('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testStockQuery();
