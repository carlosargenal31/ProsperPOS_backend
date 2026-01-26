const mysql = require('mysql2/promise');

async function testReceiverFields() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('🔍 Verificando estructura de la tabla orders...\n');

    // Ver las columnas de la tabla
    const [columns] = await connection.query(`
      DESCRIBE orders
    `);

    console.log('Columnas en la tabla orders:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });

    console.log('\n🔍 Verificando último pedido creado...\n');

    // Ver el último pedido
    const [orders] = await connection.query(`
      SELECT
        order_number,
        customer_name,
        receiver_name,
        receiver_phone,
        delivery_address,
        city,
        department,
        created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (orders.length > 0) {
      console.log('Último pedido:');
      console.log(orders[0]);
    } else {
      console.log('No hay pedidos en la base de datos');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testReceiverFields();
