const CargoDescargo = require('./src/models/cargo-descargo.model');

async function testCreate() {
  try {
    console.log('Testing cargo-descargo create...');

    const documentData = {
      document_type: 'CARGO',
      warehouse_id: 1,
      warehouse_to_id: null,
      issuer: 'Test User',
      concept: 'Test concept',
      registration_date: '2025-12-17',
      subtotal: 100,
      tax_amount: 15,
      total_amount: 115,
      status: 'BORRADOR',
      notes: ''
    };

    const details = [
      {
        product_id: 1,
        product_code: 'TEST001',
        product_name: 'Test Product',
        quantity: 5,
        unit_cost: 20,
        total_cost: 100,
        warehouse_location: '',
        sub_warehouse: '',
        current_stock: 0,
        notes: ''
      }
    ];

    const userId = 1;

    const result = await CargoDescargo.create(documentData, details, userId);
    console.log('✓ Document created successfully:', result.id);
    console.log('Document number:', result.document_number);

  } catch (error) {
    console.error('✗ Error creating document:');
    console.error('Message:', error.message);
    console.error('SQL:', error.sql);
    console.error('Stack:', error.stack);
  }
  process.exit(0);
}

testCreate();
