const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api/v1';

async function getToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: '310104'
    });
    return response.data.data.token;
  } catch (error) {
    console.error('Error en login:', error.message);
    return null;
  }
}

async function crearFacturaConCampos(token) {
  try {
    console.log('\n=== CREANDO FACTURA CON CAMPOS ADICIONALES ===\n');

    const invoiceData = {
      invoice_number: null, // El backend lo genera
      invoice_type: 'factura',
      customer_id: 1,
      customer_name: 'CLIENTE PRUEBA CAMPOS',
      customer_rtn: '00000000000000',
      issue_date: new Date().toISOString().split('T')[0],
      warehouse_id: 1,
      seller_id: 1,
      seller_name: 'VENDEDOR TEST',
      payment_status: 'paid',
      paid_amount: 230,
      shipping_cost: 0,
      payment_method: 'efectivo',
      // CAMPOS ADICIONALES
      orden_compra: 'FACTURA-TEST-001',
      constancia_exonerado: 'FACTURA-TEST-002',
      registro_sag: 'FACTURA-TEST-003'
    };

    const items = [
      {
        product_id: 1,
        product_name: 'Producto Test',
        product_sku: 'TEST001',
        quantity: 2,
        unit_price: 100,
        tax_rate: 15
      }
    ];

    console.log('📤 Enviando factura al backend...');
    console.log('Campos adicionales:');
    console.log('  - orden_compra:', invoiceData.orden_compra);
    console.log('  - constancia_exonerado:', invoiceData.constancia_exonerado);
    console.log('  - registro_sag:', invoiceData.registro_sag);
    console.log('');

    const response = await axios.post(
      `${BASE_URL}/billing/invoices`,
      {
        invoice_data: invoiceData,
        items: items
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Factura creada exitosamente');
      console.log('   ID:', response.data.data.id);
      console.log('   Número:', response.data.data.invoice_number);
      return response.data.data.id;
    }
  } catch (error) {
    console.error('❌ Error creando factura:', error.response?.data || error.message);
    return null;
  }
}

async function verificarEnBD(invoiceId) {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosper_pos'
    });

    console.log('\n=== VERIFICANDO EN BASE DE DATOS ===\n');

    const [rows] = await connection.query(`
      SELECT
        id,
        invoice_number,
        customer_name,
        orden_compra,
        constancia_exonerado,
        registro_sag
      FROM invoices
      WHERE id = ?
    `, [invoiceId]);

    if (rows.length > 0) {
      const invoice = rows[0];
      console.log('✅ Factura encontrada en BD:');
      console.log('   ID:', invoice.id);
      console.log('   Número:', invoice.invoice_number);
      console.log('   Cliente:', invoice.customer_name);
      console.log('');
      console.log('   Orden Compra:', invoice.orden_compra || '❌ VACÍO');
      console.log('   Constancia:', invoice.constancia_exonerado || '❌ VACÍO');
      console.log('   Registro SAG:', invoice.registro_sag || '❌ VACÍO');
      console.log('');

      if (invoice.orden_compra && invoice.constancia_exonerado && invoice.registro_sag) {
        console.log('🎉 ¡TODOS LOS CAMPOS SE GUARDARON CORRECTAMENTE!');
        return true;
      } else {
        console.log('❌ LOS CAMPOS NO SE GUARDARON');
        return false;
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error verificando en BD:', error.message);
    return false;
  }
}

async function run() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  TEST: FACTURA CON CAMPOS ADICIONALES               ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // 1. Login
  const token = await getToken();
  if (!token) {
    console.log('\n❌ No se pudo obtener el token');
    return;
  }
  console.log('✅ Login exitoso\n');

  // 2. Crear factura
  const invoiceId = await crearFacturaConCampos(token);
  if (!invoiceId) {
    console.log('\n❌ No se pudo crear la factura');
    return;
  }

  // 3. Esperar un poco
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. Verificar en BD
  const success = await verificarEnBD(invoiceId);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  if (success) {
    console.log('║  ✅ PRUEBA EXITOSA - TODO FUNCIONA                  ║');
  } else {
    console.log('║  ❌ PRUEBA FALLIDA - HAY UN PROBLEMA                ║');
  }
  console.log('╚══════════════════════════════════════════════════════╝\n');
}

run().catch(console.error);
