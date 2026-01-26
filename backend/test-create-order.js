// ===================================================================
// TEST: Crear pedido de prueba
// ===================================================================

const axios = require('axios');

async function testCreateOrder() {
  try {
    console.log('1. Primero, vamos a verificar que la tabla orders existe...');

    // Verificar tabla
    const db = require('./src/utils/database');
    const tables = await db.query("SHOW TABLES LIKE 'orders'");
    console.log('Tabla orders existe:', tables.length > 0);

    if (tables.length > 0) {
      // Ver estructura
      const structure = await db.query('DESCRIBE orders');
      console.log('\nEstructura de la tabla orders:');
      structure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

      // Contar pedidos existentes
      const [count] = await db.query('SELECT COUNT(*) as total FROM orders');
      console.log(`\nTotal de pedidos en la base de datos: ${count.total}`);

      // Ver últimos pedidos
      if (count.total > 0) {
        const lastOrders = await db.query('SELECT * FROM orders ORDER BY id DESC LIMIT 3');
        console.log('\nÚltimos 3 pedidos:');
        lastOrders.forEach(order => {
          console.log(`  - ${order.order_number}: ${order.customer_name} - ${order.status} - L${order.total_amount}`);
        });
      }
    }

    console.log('\n2. Probando crear un pedido de prueba...');

    // Datos de prueba
    const testOrder = {
      customer_name: 'Cliente de Prueba',
      customer_email: 'test@test.com',
      customer_phone: '9999-9999',
      delivery_address: 'Calle de Prueba #123',
      city: 'Tegucigalpa',
      department: 'Francisco Morazán',
      total_amount: 500.00,
      items: [
        {
          product_id: 1,
          product_name: 'Producto de Prueba',
          product_code: 'TEST-001',
          quantity: 2,
          unit_price: 250.00,
          subtotal: 500.00
        }
      ],
      notes: 'Pedido de prueba desde script'
    };

    const OrderService = require('./src/services/order.service');
    const result = await OrderService.createOrder(testOrder);

    console.log('\n✅ Pedido creado exitosamente!');
    console.log('Order ID:', result.order_id);
    console.log('Order Number:', result.order_number);

    // Verificar que se creó
    const [newCount] = await db.query('SELECT COUNT(*) as total FROM orders');
    console.log(`\nTotal de pedidos después de crear: ${newCount.total}`);

    // Ver el pedido creado
    const createdOrder = await OrderService.getOrderById(result.order_id);
    console.log('\nDatos del pedido creado:');
    console.log(JSON.stringify(createdOrder, null, 2));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCreateOrder();
