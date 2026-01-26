// Script de prueba para verificar el endpoint de pedidos
require('dotenv').config();
const db = require('./src/utils/database');

async function testOrdersEndpoint() {
  try {
    console.log('🔍 Verificando pedidos en la base de datos...\n');

    // Verificar que existan pedidos
    const allOrders = await db.query(`
      SELECT id, order_number, customer_id, customer_name, total_amount, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`📦 Total de pedidos en DB: ${allOrders.length}\n`);

    if (allOrders.length > 0) {
      console.log('Últimos pedidos:');
      console.table(allOrders.map(o => ({
        id: o.id,
        numero: o.order_number,
        customer_id: o.customer_id,
        cliente: o.customer_name,
        total: o.total_amount,
        estado: o.status
      })));

      // Verificar cuántos tienen customer_id
      const ordersWithCustomerId = allOrders.filter(o => o.customer_id !== null);
      console.log(`\n✅ Pedidos con customer_id: ${ordersWithCustomerId.length}`);
      console.log(`❌ Pedidos sin customer_id: ${allOrders.length - ordersWithCustomerId.length}`);

      // Verificar clientes existentes
      const customers = await db.query('SELECT id, email, first_name, last_name FROM ecommerce_customers');
      console.log(`\n👥 Clientes registrados: ${customers.length}`);

      if (customers.length > 0) {
        console.log('\nClientes:');
        console.table(customers.map(c => ({
          id: c.id,
          email: c.email,
          nombre: `${c.first_name} ${c.last_name}`
        })));

        // Probar consulta del servicio con un customer_id real
        const testCustomerId = customers[0].id;
        console.log(`\n🧪 Probando consulta con customer_id = ${testCustomerId}:`);

        const customerOrders = await db.query(`
          SELECT
            o.*,
            COUNT(oi.id) as items_count
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.customer_id = ?
          GROUP BY o.id
          ORDER BY o.created_at DESC
        `, [testCustomerId]);

        console.log(`Pedidos encontrados para customer_id ${testCustomerId}: ${customerOrders.length}`);

        if (customerOrders.length > 0) {
          console.table(customerOrders.map(o => ({
            id: o.id,
            numero: o.order_number,
            total: o.total_amount,
            items: o.items_count,
            estado: o.status
          })));
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testOrdersEndpoint();
