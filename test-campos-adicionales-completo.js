const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de autenticación (debes tener un usuario activo)
let authToken = null;

async function login() {
  try {
    console.log('\n=== 1. LOGIN ===');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: '310104'
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✓ Login exitoso');
      console.log('Token:', authToken.substring(0, 20) + '...');
      return true;
    }
  } catch (error) {
    console.error('✗ Error en login:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateQuote() {
  try {
    console.log('\n=== 2. CREAR COTIZACIÓN ===');

    const quoteData = {
      customer_id: 1,
      customer_name: 'CLIENTE DE PRUEBA',
      customer_rtn: '00000000000000',
      customer_phone: '2440-0000',
      customer_email: 'test@example.com',
      branch_id: 1,
      warehouse_id: 1,
      seller_id: 1,
      seller_name: 'VENDEDOR TEST',
      items: [
        {
          product_id: 1,
          product_code: 'PROD001',
          product_name: 'Producto de Prueba',
          quantity: 2,
          unit_price: 100.00,
          discount_value: 0,
          tax_rate: 15,
          warehouse_id: 1
        }
      ],
      subtotal: 200.00,
      discount: 0,
      tax: 30.00,
      total: 230.00,
      surcharge: 0,
      quote_date: new Date().toISOString().split('T')[0],
      valid_until: null,
      notes: 'Cotización de prueba',
      terms_conditions: 'Términos y condiciones',
      orden_compra: 'ORDEN-TEST-001',
      constancia_exonerado: 'CONST-TEST-002',
      registro_sag: 'SAG-TEST-003'
    };

    const response = await axios.post(`${BASE_URL}/quotes`, quoteData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✓ Cotización creada exitosamente');
      console.log('  ID:', response.data.data.id);
      console.log('  Número:', response.data.data.quote_number);
      return response.data.data.id;
    }
  } catch (error) {
    console.error('✗ Error creando cotización:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testCreatePendingInvoice() {
  try {
    console.log('\n=== 3. CREAR FACTURA EN ESPERA ===');

    const pendingData = {
      customer_id: 1,
      customer_name: 'CLIENTE DE PRUEBA 2',
      customer_rtn: '11111111111111',
      customer_phone: '2440-1111',
      customer_email: 'test2@example.com',
      branch_id: 1,
      warehouse_id: 1,
      seller_id: 1,
      seller_name: 'VENDEDOR TEST',
      items: [
        {
          product_id: 1,
          product_code: 'PROD002',
          product_name: 'Producto de Prueba 2',
          quantity: 3,
          unit_price: 150.00,
          discount_value: 0,
          tax_rate: 15,
          warehouse_id: 1
        }
      ],
      subtotal: 450.00,
      discount: 0,
      tax: 67.50,
      total: 517.50,
      surcharge: 0,
      notes: 'Factura en espera de prueba',
      internal_notes: 'Notas internas',
      expires_at: null,
      orden_compra: 'ORDEN-PENDING-001',
      constancia_exonerado: 'CONST-PENDING-002',
      registro_sag: 'SAG-PENDING-003'
    };

    const response = await axios.post(`${BASE_URL}/pending-invoices`, pendingData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✓ Factura en espera creada exitosamente');
      console.log('  ID:', response.data.data.id);
      console.log('  Número:', response.data.data.document_number);
      return response.data.data.id;
    }
  } catch (error) {
    console.error('✗ Error creando factura en espera:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testCreateInvoice() {
  try {
    console.log('\n=== 4. CREAR FACTURA ===');

    const invoiceData = {
      invoice_data: {
        customer_id: 1,
        customer_name: 'CLIENTE DE PRUEBA 3',
        customer_rtn: '22222222222222',
        issue_date: new Date().toISOString().split('T')[0],
        warehouse_id: 1,
        seller_id: 1,
        seller_name: 'VENDEDOR TEST',
        payment_status: 'pending',
        orden_compra: 'ORDEN-INVOICE-001',
        constancia_exonerado: 'CONST-INVOICE-002',
        registro_sag: 'SAG-INVOICE-003'
      },
      items: [
        {
          product_id: 1,
          product_name: 'Producto de Prueba 3',
          product_sku: 'PROD003',
          quantity: 5,
          unit_price: 200.00,
          tax_rate: 15
        }
      ]
    };

    const response = await axios.post(`${BASE_URL}/billing/invoices`, invoiceData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✓ Factura creada exitosamente');
      console.log('  ID:', response.data.data.id);
      console.log('  Número:', response.data.data.invoice_number);
      return response.data.data.id;
    }
  } catch (error) {
    console.error('✗ Error creando factura:', error.response?.data?.message || error.message);
    console.error('Detalles:', error.response?.data);
    return null;
  }
}

async function verifyQuote(quoteId) {
  try {
    console.log('\n=== 5. VERIFICAR COTIZACIÓN ===');

    const response = await axios.get(`${BASE_URL}/quotes/${quoteId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const quote = response.data.data;
      console.log('✓ Cotización recuperada');
      console.log('  Número:', quote.quote_number);
      console.log('  Orden Compra:', quote.orden_compra || 'NO GUARDADO ❌');
      console.log('  Constancia:', quote.constancia_exonerado || 'NO GUARDADO ❌');
      console.log('  Registro SAG:', quote.registro_sag || 'NO GUARDADO ❌');

      if (quote.orden_compra && quote.constancia_exonerado && quote.registro_sag) {
        console.log('  ✓ TODOS LOS CAMPOS GUARDADOS CORRECTAMENTE');
      } else {
        console.log('  ✗ FALTAN CAMPOS POR GUARDAR');
      }
    }
  } catch (error) {
    console.error('✗ Error verificando cotización:', error.message);
  }
}

async function verifyPendingInvoice(pendingId) {
  try {
    console.log('\n=== 6. VERIFICAR FACTURA EN ESPERA ===');

    const response = await axios.get(`${BASE_URL}/pending-invoices/${pendingId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const pending = response.data.data;
      console.log('✓ Factura en espera recuperada');
      console.log('  Número:', pending.document_number);
      console.log('  Orden Compra:', pending.orden_compra || 'NO GUARDADO ❌');
      console.log('  Constancia:', pending.constancia_exonerado || 'NO GUARDADO ❌');
      console.log('  Registro SAG:', pending.registro_sag || 'NO GUARDADO ❌');

      if (pending.orden_compra && pending.constancia_exonerado && pending.registro_sag) {
        console.log('  ✓ TODOS LOS CAMPOS GUARDADOS CORRECTAMENTE');
      } else {
        console.log('  ✗ FALTAN CAMPOS POR GUARDAR');
      }
    }
  } catch (error) {
    console.error('✗ Error verificando factura en espera:', error.message);
  }
}

async function verifyInvoice(invoiceId) {
  try {
    console.log('\n=== 7. VERIFICAR FACTURA ===');

    const response = await axios.get(`${BASE_URL}/billing/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const invoice = response.data.data;
      console.log('✓ Factura recuperada');
      console.log('  Número:', invoice.invoice_number);
      console.log('  Orden Compra:', invoice.orden_compra || 'NO GUARDADO ❌');
      console.log('  Constancia:', invoice.constancia_exonerado || 'NO GUARDADO ❌');
      console.log('  Registro SAG:', invoice.registro_sag || 'NO GUARDADO ❌');

      if (invoice.orden_compra && invoice.constancia_exonerado && invoice.registro_sag) {
        console.log('  ✓ TODOS LOS CAMPOS GUARDADOS CORRECTAMENTE');
      } else {
        console.log('  ✗ FALTAN CAMPOS POR GUARDAR');
      }
    }
  } catch (error) {
    console.error('✗ Error verificando factura:', error.message);
  }
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  PRUEBA COMPLETA DE CAMPOS ADICIONALES              ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // 1. Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n✗ No se pudo hacer login. Verifica las credenciales.');
    return;
  }

  // 2. Crear y verificar cotización
  const quoteId = await testCreateQuote();
  if (quoteId) {
    await verifyQuote(quoteId);
  }

  // 3. Crear y verificar factura en espera
  const pendingId = await testCreatePendingInvoice();
  if (pendingId) {
    await verifyPendingInvoice(pendingId);
  }

  // 4. Crear y verificar factura
  const invoiceId = await testCreateInvoice();
  if (invoiceId) {
    await verifyInvoice(invoiceId);
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  PRUEBAS COMPLETADAS                                ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
}

// Ejecutar pruebas
runTests().catch(console.error);
