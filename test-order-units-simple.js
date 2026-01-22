const { getConnection } = require('./src/utils/database');

async function testOrderUnits() {
  const connection = await getConnection();

  try {
    // Get a recent order with its items and units
    const [orders] = await connection.execute(`
      SELECT
        o.id,
        o.order_number,
        o.customer_id
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 1
    `);

    if (orders.length === 0) {
      console.log('No orders found');
      return;
    }

    const order = orders[0];
    console.log(`\n=== Testing Order ${order.order_number} (ID: ${order.id}) ===\n`);

    // Get order items with units using the same query as the service
    const [items] = await connection.execute(`
      SELECT
        oi.*,
        p.image as product_image,
        COALESCE(u.name, 'UNIDAD') as unit
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE oi.order_id = ?
    `, [order.id]);

    console.log('Order Items with Units:');
    items.forEach(item => {
      console.log(`  - ${item.product_name}`);
      console.log(`    Product ID: ${item.product_id}`);
      console.log(`    Unit: ${item.unit}`);
      console.log(`    Quantity: ${item.quantity}`);
      console.log('');
    });

    // Also test what the product table has
    console.log('\n=== Checking Product Units Directly ===\n');
    for (const item of items) {
      const [productInfo] = await connection.execute(`
        SELECT p.id, p.name, p.unit_id, u.name as unit_name
        FROM products p
        LEFT JOIN units u ON p.unit_id = u.id
        WHERE p.id = ?
      `, [item.product_id]);

      if (productInfo.length > 0) {
        const prod = productInfo[0];
        console.log(`Product ${prod.id}: ${prod.name}`);
        console.log(`  unit_id: ${prod.unit_id}`);
        console.log(`  unit_name: ${prod.unit_name}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    connection.release();
  }
}

testOrderUnits();
