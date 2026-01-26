const mysql = require('mysql2/promise');

async function checkLastOrder() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('🔍 Verificando último pedido...\n');

    const [orders] = await connection.query(`
      SELECT
        order_number,
        customer_name,
        receiver_name,
        receiver_phone,
        delivery_address,
        city,
        department,
        notes,
        additional_comments,
        created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (orders.length > 0) {
      console.log('Último pedido:');
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('No hay pedidos en la base de datos');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkLastOrder();
