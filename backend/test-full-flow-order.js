const axios = require('axios');

async function testFullFlow() {
  try {
    console.log('🧪 Probando flujo completo de pedido...\n');

    // 1. Registrar cliente
    console.log('1️⃣ Registrando cliente...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = '123456';

    try {
      const registerResponse = await axios.post('http://localhost:3000/api/v1/ecommerce/auth/register', {
        first_name: 'Test',
        last_name: 'Cliente',
        email: testEmail,
        phone: '3192-3555',
        password: testPassword,
        dni: '0801-1990-12345'
      });

      if (!registerResponse.data.success) {
        console.error('❌ Error al registrar:', registerResponse.data);
        return;
      }

      console.log('✅ Cliente registrado\n');
    } catch (error) {
      if (error.response?.data?.message?.includes('correo ya está registrado')) {
        console.log('✓ Cliente ya existe, continuando...\n');
      } else {
        throw error;
      }
    }

    // 2. Iniciar sesión
    console.log('2️⃣ Iniciando sesión...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/ecommerce/auth/login', {
      email: testEmail,
      password: testPassword
    });

    if (!loginResponse.data.success) {
      console.error('❌ Error al iniciar sesión:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Sesión iniciada\n');

    // 3. Crear pedido
    console.log('3️⃣ Creando pedido...');
    const orderData = {
      delivery_address: 'Calle de prueba 123',
      department: 'Atlántida',
      city: 'La Ceiba',
      receiver_name: 'Test Cliente',
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
      console.log('\nRespuesta:');
      console.log(JSON.stringify(orderResponse.data, null, 2));
    } else {
      console.error('❌ Error al crear pedido:', orderResponse.data);
    }

  } catch (error) {
    console.error('\n❌ ERROR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
      console.error(error.stack);
    }
  }
}

testFullFlow();
