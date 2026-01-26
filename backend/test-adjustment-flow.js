// Test script to verify the complete adjustment flow
const InventoryAdjustmentService = require('./src/services/inventory-adjustment.service');

async function testAdjustmentFlow() {
  try {
    console.log('=== TESTING INVENTORY ADJUSTMENT FLOW ===\n');

    const testData = {
      consecutive: 'TEST-001',
      issue_date: new Date().toISOString(),
      issuer: 'Test User',
      warehouse_id: 1,
      concept: 'Test adjustment',
      items: [
        {
          product_id: 1,
          exist_teorica: 0,
          exist_fisica: 5,
          diferencia: 5,
          costo_unit: 10
        }
      ]
    };

    console.log('Step 1: Creating adjustment...');
    console.log('Data:', JSON.stringify(testData, null, 2));

    const result = await InventoryAdjustmentService.createAdjustment(testData, 1);
    console.log('Adjustment created:', result);
    console.log('');

    console.log('Step 2: Applying adjustment to stock...');
    const applyResult = await InventoryAdjustmentService.applyAdjustment(result.id, 1);
    console.log('Adjustment applied:', applyResult);
    console.log('');

    console.log('Step 3: Checking stock after adjustment...');
    const inventory = await InventoryAdjustmentService.getInventoryForAdjustment({
      warehouse_id: 1,
      store_id: 1,
      product_id: 1
    });

    if (inventory.length > 0) {
      console.log('Stock data:', {
        producto: inventory[0].producto,
        exist_teorica: inventory[0].exist_teorica,
        bodega: inventory[0].bodega
      });

      if (inventory[0].exist_teorica === 5) {
        console.log('\n✓ SUCCESS: Stock was updated correctly!');
      } else {
        console.log('\n✗ ERROR: Stock was NOT updated correctly. Expected 5, got:', inventory[0].exist_teorica);
      }
    }

    console.log('\n=== TEST COMPLETED ===');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAdjustmentFlow();
