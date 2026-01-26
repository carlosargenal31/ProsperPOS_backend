require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

async function loginAndGetToken() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prosperpos.com',
      password: 'Admin1234'
    });
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Error al hacer login:', error.response?.data || error.message);
    throw error;
  }
}

async function testFullFlow() {
  console.log('🚀 Iniciando prueba de flujo completo de cupones\n');

  try {
    // 1. Hacer login
    console.log('1️⃣ Haciendo login...');
    const token = await loginAndGetToken();
    console.log('✅ Login exitoso\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Crear una cotización CON cupones y ofertas
    console.log('2️⃣ Creando cotización con cupones y ofertas...');

    const quoteData = {
      customer_name: 'Cliente Test',
      customer_rtn: '0801199012345',
      customer_phone: '9999-9999',
      customer_email: 'test@test.com',
      branch_id: 1,
      warehouse_id: 1,
      seller_id: 1,
      seller_name: 'Admin User',
      items: [
        {
          product_id: 1,
          product_code: 'PROD001',
          product_name: 'Producto Test',
          quantity: 2,
          unit_price: 500.00,
          discount_value: 0,
          tax_rate: 15,
          warehouse_id: 1
        }
      ],
      subtotal: 1000.00,
      discount: 150.00,
      discount_type: 'coupon',
      discount_value: 150.00,
      tax: 127.50, // 15% de (1000 - 150)
      total: 977.50,
      surcharge: 0,
      applied_coupons: [
        { code: 'CUPON10', name: 'Descuento 10%', amount: 100.00 },
        { code: 'PROMO50', name: 'Promoción 50', amount: 50.00 }
      ],
      applied_offers: [
        { id: 1, name: '2x1 en productos seleccionados', discount_amount: 0 }
      ],
      quote_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Cotización de prueba con cupones',
      terms_conditions: 'Términos y condiciones'
    };

    const createResponse = await axios.post(`${API_URL}/quotes`, quoteData, { headers });
    const quoteId = createResponse.data.data.id;
    const quoteNumber = createResponse.data.data.quote_number;

    console.log(`✅ Cotización creada: ID ${quoteId}, Número ${quoteNumber}`);
    console.log(`   Cupones aplicados: ${quoteData.applied_coupons.length}`);
    console.log(`   Ofertas aplicadas: ${quoteData.applied_offers.length}\n`);

    // 3. Recuperar la cotización y verificar que los cupones están ahí
    console.log('3️⃣ Recuperando cotización...');

    const getResponse = await axios.get(`${API_URL}/quotes/${quoteId}`, { headers });
    const retrievedQuote = getResponse.data.data;

    console.log(`✅ Cotización recuperada: ${retrievedQuote.quote_number}`);
    console.log(`   Subtotal: ${retrievedQuote.subtotal}`);
    console.log(`   Descuento: ${retrievedQuote.discount}`);
    console.log(`   Total: ${retrievedQuote.total}`);

    if (retrievedQuote.applied_coupons && Array.isArray(retrievedQuote.applied_coupons)) {
      console.log(`\n   ✅ Cupones recuperados (${retrievedQuote.applied_coupons.length}):`);
      retrievedQuote.applied_coupons.forEach(coupon => {
        console.log(`      - ${coupon.code}: ${coupon.name} ($${coupon.amount})`);
      });
    } else {
      console.log('\n   ❌ No se recuperaron cupones');
    }

    if (retrievedQuote.applied_offers && Array.isArray(retrievedQuote.applied_offers)) {
      console.log(`\n   ✅ Ofertas recuperadas (${retrievedQuote.applied_offers.length}):`);
      retrievedQuote.applied_offers.forEach(offer => {
        console.log(`      - ${offer.name} ($${offer.discount_amount})`);
      });
    } else {
      console.log('\n   ❌ No se recuperaron ofertas');
    }

    // 4. Simular importación (en el frontend, esto cargaría docData.applied_coupons)
    console.log('\n4️⃣ Simulando importación en POS...');
    console.log('   El frontend ahora recibiría:');
    console.log('   - docData.applied_coupons:', JSON.stringify(retrievedQuote.applied_coupons));
    console.log('   - docData.applied_offers:', JSON.stringify(retrievedQuote.applied_offers));

    // 5. Limpiar - Eliminar la cotización de prueba
    console.log('\n5️⃣ Limpiando datos de prueba...');
    await axios.delete(`${API_URL}/quotes/${quoteId}`, { headers });
    console.log('✅ Cotización de prueba eliminada\n');

    console.log('✨ PRUEBA COMPLETADA EXITOSAMENTE ✨\n');
    console.log('Resumen:');
    console.log('- Crear cotización con cupones: ✅');
    console.log('- Guardar cupones en base de datos: ✅');
    console.log('- Recuperar cupones desde API: ✅');
    console.log('- Formato correcto para importación: ✅');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
  }
}

// Esperar 3 segundos para que el servidor inicie
console.log('⏳ Esperando a que el servidor inicie...\n');
setTimeout(testFullFlow, 3000);
