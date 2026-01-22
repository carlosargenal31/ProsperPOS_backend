const axios = require('axios');

async function testOrderDetails() {
  try {
    // First login to get a valid token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/ecommerce/customers/login', {
      email: 'carlosargenal04@gmail.com',
      password: '310104'
    });

    const token = loginResponse.data.token;
    console.log('Login successful, token obtained');

    // Get orders
    const ordersResponse = await axios.get('http://localhost:3000/api/v1/ecommerce/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n=== ORDERS RESPONSE ===');
    console.log(JSON.stringify(ordersResponse.data, null, 2));

    // Get first order details
    if (ordersResponse.data.orders && ordersResponse.data.orders.length > 0) {
      const orderNumber = ordersResponse.data.orders[0].order_number;
      console.log(`\n=== Getting details for order: ${orderNumber} ===`);

      const orderDetailResponse = await axios.get(`http://localhost:3000/api/v1/ecommerce/orders/${orderNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('\n=== ORDER DETAIL RESPONSE ===');
      console.log(JSON.stringify(orderDetailResponse.data, null, 2));

      // Check if items have unit field
      if (orderDetailResponse.data.order && orderDetailResponse.data.order.items) {
        console.log('\n=== CHECKING UNITS IN ITEMS ===');
        orderDetailResponse.data.order.items.forEach(item => {
          console.log(`Product: ${item.product_name}, Unit: ${item.unit || 'NOT PRESENT'}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testOrderDetails();
