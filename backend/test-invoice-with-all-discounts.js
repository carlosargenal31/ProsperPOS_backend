require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testInvoiceWithAllDiscounts() {
  try {
    console.log('🧪 Probando creación de factura con todos los descuentos\n');

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

    // 2. Crear factura exactamente como lo haría el frontend
    console.log('2️⃣ Creando factura...\n');

    const invoicePayload = {
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
        applied_coupons: [
          { code: 'CUPON300', name: 'Descuento 300', amount: 300.00 }
        ],
        applied_offers: [
          { id: 1, name: 'Oferta 220', amount: 220.00 }
        ],
        shipping_cost: 100.00,
        total: 3906.50,
        payment_status: 'paid',
        payment_method: 'EFECTIVO',
        status: 'issued'
      },
      items: [
        {
          product_id: 1,
          product_name: 'Producto Test',
          quantity: 11,
          unit_price: 350.00,
          discount_type: null,
          discount_value: 0,
          tax_rate: 15,
          warehouse_id: 1
        }
      ]
    };

    console.log('📊 Datos enviados:');
    console.log('   Subtotal:', invoicePayload.invoice_data.subtotal);
    console.log('   Cupones:', invoicePayload.invoice_data.coupons_discount);
    console.log('   Ofertas:', invoicePayload.invoice_data.offers_discount);
    console.log('   Global:', invoicePayload.invoice_data.discount_value);
    console.log('   Total descuentos:', invoicePayload.invoice_data.discount);
    console.log('   ISV:', invoicePayload.invoice_data.tax);
    console.log('   Recargos:', invoicePayload.invoice_data.shipping_cost);
    console.log('   TOTAL:', invoicePayload.invoice_data.total);
    console.log('');

    const response = await axios.post(
      `${API_URL}/billing/invoices?store_id=1`,
      invoicePayload,
      { headers }
    );

    console.log('✅ Factura creada exitosamente!');
    console.log('   ID:', response.data.data.id);
    console.log('   Número:', response.data.data.invoice_number);
    console.log('');

    // 3. Verificar en base de datos
    console.log('3️⃣ Verificando la factura creada...');
    const checkResponse = await axios.get(
      `${API_URL}/billing/invoices/${response.data.data.id}`,
      { headers }
    );

    const invoice = checkResponse.data.data;
    console.log('   Subtotal BD:', invoice.subtotal);
    console.log('   Descuento BD:', invoice.discount_amount);
    console.log('   ISV BD:', invoice.tax_amount);
    console.log('   Recargos BD:', invoice.shipping_cost);
    console.log('   Total BD:', invoice.total);
    console.log('');

    // Verificar que los valores coincidan
    const matches = {
      subtotal: invoice.subtotal === 3850.00,
      discount: invoice.discount_amount === 540.00,
      tax: invoice.tax_amount === 496.50,
      shipping: invoice.shipping_cost === 100.00,
      total: invoice.total === 3906.50
    };

    console.log('✅ Verificación de valores:');
    console.log('   Subtotal:', matches.subtotal ? '✅' : '❌');
    console.log('   Descuento:', matches.discount ? '✅' : '❌');
    console.log('   ISV:', matches.tax ? '✅' : '❌');
    console.log('   Recargos:', matches.shipping ? '✅' : '❌');
    console.log('   Total:', matches.total ? '✅' : '❌');

    const allMatch = Object.values(matches).every(m => m);
    if (allMatch) {
      console.log('\n🎉 TODOS LOS VALORES SON CORRECTOS!');
    } else {
      console.log('\n⚠️  Algunos valores no coinciden');
    }

  } catch (error) {
    console.error('\n❌ Error:');
    console.error('   Status:', error.response?.status);
    console.error('   Mensaje:', error.response?.data?.message);
    console.error('   Error:', error.response?.data?.error);

    if (error.response?.status === 500) {
      console.error('\n⚠️  Error 500 - revisar logs del servidor para más detalles');
    }
  }
}

// Ejecutar la prueba
testInvoiceWithAllDiscounts();
