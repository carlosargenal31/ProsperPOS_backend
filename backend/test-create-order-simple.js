const axios = require('axios');

async function testCreateOrder() {
  try {
    console.log('🧪 Probando crear pedido...\n');

    // Primero obtener un token válido (login)
    console.log('1️⃣ Iniciando sesión...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/ecommerce/auth/login', {
      email: 'carlosargenal31@gmail.com',
      password: '310104'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Error al iniciar sesión:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Sesión iniciada, token obtenido\n');

    // Crear un pedido de prueba
    console.log('2️⃣ Creando pedido...');
    const orderData = {
      delivery_address: 'Calle de prueba 123',
      department: 'Atlántida',
      city: 'La Ceiba',
      receiver_name: 'Carlos Test',
      receiver_phone: '3192-3555',
      receiver_phone_country: '+504',
      customer_phone_country: '+504',
      items: [
        {
          product_id: 1017,
          product_name: 'CERAMICA 46014 46X46CM (1.90MT2-9PZS)',
          product_code: 'FF-0051-9',
          quantity: 2,
          unit_price: 360.00,
          subtotal: 720.00
        }
      ],
      notes: 'Pedido de prueba',
      additional_comments: 'Comentario adicional',
      customer_dni: '0801-1990-12345',
      invoice_type: 'Consumidor Final',
      rtn: null,
      business_name: null,
      payment_method: 'Efectivo'
    };

    console.log('Datos del pedido:');
    console.log(JSON.stringify(orderData, null, 2));
    console.log('');

    const orderResponse = await axios.post(
      'http://localhost:3000/api/v1/ecommerce/orders',
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (orderResponse.data.success) {
      console.log('✅ Pedido creado exitosamente!');
      console.log('Respuesta:', JSON.stringify(orderResponse.data, null, 2));
    } else {
      console.error('❌ Error al crear pedido:', orderResponse.data);
    }

  } catch (error) {
    console.error('❌ ERROR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
      console.error(error.stack);
    }
  }
}

testCreateOrder();
