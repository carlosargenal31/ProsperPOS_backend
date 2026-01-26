require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

async function testCreateInvoice() {
  try {
    // 1. Login
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });
    const token = loginResponse.data.data.token;
    console.log('✅ Login exitoso\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Crear factura con todos los descuentos
    console.log('2️⃣ Creando factura con descuentos...');

    const invoiceData = {
      invoice_data: {
        customer_name: 'CONSUMIDOR FINAL',
        customer_rtn: '00000000000000',
        warehouse_id: 1,
        seller_id: 1,
        seller_name: 'Admin',
        subtotal: 3850.00,
        tax: 496.50,
        discount: 540.00,
        discount_type: 'amount',
        discount_value: 20.00,
        coupons_discount: 300.00,
        offers_discount: 220.00,
        shipping_cost: 100.00,
        total: 3906.50,
        payment_status: 'paid',
        payment_method: 'EFECTIVO'
      },
      items: [
        {
          product_id: 1,
          product_name: 'Producto Test',
          quantity: 11,
          unit_price: 350.00,
          discount_type: null,
          discount_value: 0,
          tax_rate: 15
        }
      ]
    };

    console.log('📤 Enviando factura:');
    console.log('   Subtotal: 3850.00');
    console.log('   Cupones: -300.00');
    console.log('   Ofertas: -220.00');
    console.log('   Global: -20.00');
    console.log('   Total descuentos: -540.00');
    console.log('   Subtotal después descuentos: 3310.00');
    console.log('   ISV (15%): +496.50');
    console.log('   Recargos: +100.00');
    console.log('   TOTAL: 3906.50\n');

    const response = await axios.post(`${API_URL}/billing/invoices`, invoiceData, { headers });

    console.log('✅ Factura creada exitosamente!');
    console.log('   ID:', response.data.data?.id);
    console.log('   Número:', response.data.data?.invoice_number);

  } catch (error) {
    console.error('\n❌ Error al crear factura:');
    console.error('Status:', error.response?.status);
    console.error('Mensaje:', error.response?.data?.message);
    console.error('Error completo:', error.response?.data?.error);

    if (error.response?.data?.details) {
      console.error('Detalles:', error.response.data.details);
    }
  }
}

// Esperar 2 segundos para que el servidor inicie
console.log('⏳ Esperando servidor...\n');
setTimeout(testCreateInvoice, 2000);
