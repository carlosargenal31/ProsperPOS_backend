const db = require('./src/utils/database');

async function testPurchaseReprint() {
  try {
    console.log('Testing purchase reprint queries...\n');

    // Test 1: Get a purchase document
    console.log('1. Getting purchase documents...');
    const purchases = await db.query(`
      SELECT
        pd.id,
        pd.purchase_number as document_number,
        pd.purchase_number as full_number,
        pd.purchase_date as issue_date,
        NULL as expiry_date,
        pd.supplier_name,
        COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as created_by_name,
        pd.total_amount as total,
        pd.status,
        'COMPRA' as document_type
      FROM purchases_documents pd
      LEFT JOIN users u ON pd.created_by = u.id
      WHERE pd.deleted_at IS NULL
        AND pd.status != 'Returned'
      ORDER BY pd.created_at DESC LIMIT 5
    `);

    console.log(`Found ${purchases.length} purchases`);
    if (purchases.length > 0) {
      console.log('First purchase:', purchases[0]);

      // Test 2: Get purchase details
      const purchaseId = purchases[0].id;
      console.log(`\n2. Getting details for purchase ID ${purchaseId}...`);

      const purchaseDetails = await db.query(`
        SELECT
          pd.*,
          pd.purchase_number as correlative,
          pd.supplier_id_number as supplier_rtn,
          pd.net_amount as subtotal,
          pd.discount_amount as discount,
          pd.surcharge_amount as surcharge,
          pd.tax_amount as tax,
          pd.total_amount,
          COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, 'Sistema') as created_by_name
        FROM purchases_documents pd
        LEFT JOIN users u ON pd.created_by = u.id
        WHERE pd.id = ?
      `, [purchaseId]);

      if (purchaseDetails.length > 0) {
        console.log('Purchase details found');
        console.log('Keys:', Object.keys(purchaseDetails[0]));

        // Test 3: Get purchase items
        console.log(`\n3. Getting items for purchase ID ${purchaseId}...`);
        const items = await db.query(`
          SELECT
            pdi.*,
            pdi.product_code,
            pdi.product_name,
            pdi.quantity,
            pdi.unit_price,
            pdi.discount_amount as discount,
            pdi.tax_amount as tax,
            pdi.subtotal,
            pdi.total
          FROM purchases_documents_items pdi
          WHERE pdi.purchase_id = ?
        `, [purchaseId]);

        console.log(`Found ${items.length} items`);
        if (items.length > 0) {
          console.log('First item:', items[0]);
        }
      } else {
        console.log('ERROR: No purchase details found');
      }
    }

    // Test 4: Check purchase returns
    console.log('\n4. Getting purchase returns...');
    const returns = await db.query(`
      SELECT
        pr.id,
        pr.correlative as document_number,
        pr.correlative as full_number,
        pr.emission_date as issue_date,
        NULL as expiry_date,
        pr.supplier_name,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        pr.total,
        'Completada' as status,
        'DEVOLUCION COMPRA' as document_type
      FROM purchase_returns pr
      LEFT JOIN users u ON pr.created_by = u.id
      WHERE 1=1
      ORDER BY pr.created_at DESC LIMIT 5
    `);

    console.log(`Found ${returns.length} purchase returns`);

    console.log('\n✅ All tests completed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPurchaseReprint();
