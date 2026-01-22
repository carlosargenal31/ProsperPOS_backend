const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcHJvc3BlcnBvcy5jb20iLCJpYXQiOjE3Njg4NjQzNjUsImV4cCI6MTc2ODk1MDc2NX0.ObDohYWBaXJ7aYGhfOnje5aCARzcSGX1JEx_5q3vTDY';

async function crearFactura() {
  try {
    console.log('\n========================================');
    console.log('ENVIANDO FACTURA AL BACKEND');
    console.log('========================================\n');

    const requestData = {
      invoice_data: {
        invoice_number: '9999999999',
        customer_id: 1,
        customer_name: 'TEST CAMPOS FACTURA',
        customer_rtn: '00000000000000',
        issue_date: new Date().toISOString().split('T')[0],
        warehouse_id: 1,
        seller_id: 1,
        seller_name: 'VENDEDOR',
        payment_status: 'paid',
        paid_amount: 230,
        shipping_cost: 0,
        payment_method: 'efectivo',
        orden_compra: 'DIRECTO-001',
        constancia_exonerado: 'DIRECTO-002',
        registro_sag: 'DIRECTO-003'
      },
      items: [
        {
          product_id: 1,
          product_name: 'Producto Test',
          product_sku: 'TEST001',
          quantity: 2,
          unit_price: 100,
          tax_rate: 15
        }
      ]
    };

    console.log('📦 Datos a enviar:');
    console.log(JSON.stringify(requestData, null, 2));
    console.log('\n');

    const response = await axios.post(
      `${BASE_URL}/billing/invoices`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Respuesta del servidor:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      const invoiceId = response.data.data.id;
      console.log(`\n✅ Factura creada con ID: ${invoiceId}`);
      console.log(`   Número: ${response.data.data.invoice_number}`);

      // Verificar en BD
      await verificarEnBD(invoiceId);
    }
  } catch (error) {
    console.error('\n❌ ERROR:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
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

    console.log('\n========================================');
    console.log('VERIFICANDO EN BASE DE DATOS');
    console.log('========================================\n');

    const [rows] = await connection.query(`
      SELECT
        id,
        invoice_number,
        customer_name,
        orden_compra,
        constancia_exonerado,
        registro_sag,
        created_at
      FROM invoices
      WHERE id = ?
    `, [invoiceId]);

    if (rows.length > 0) {
      const inv = rows[0];
      console.log(`Factura #${inv.id}`);
      console.log(`Número: ${inv.invoice_number}`);
      console.log(`Cliente: ${inv.customer_name}`);
      console.log(`Fecha: ${inv.created_at}`);
      console.log('');
      console.log(`Orden Compra: "${inv.orden_compra}" ${inv.orden_compra ? '✅' : '❌'}`);
      console.log(`Constancia: "${inv.constancia_exonerado}" ${inv.constancia_exonerado ? '✅' : '❌'}`);
      console.log(`Registro SAG: "${inv.registro_sag}" ${inv.registro_sag ? '✅' : '❌'}`);
      console.log('');

      if (inv.orden_compra && inv.constancia_exonerado && inv.registro_sag) {
        console.log('🎉 ¡TODOS LOS CAMPOS SE GUARDARON CORRECTAMENTE!');
      } else {
        console.log('❌ LOS CAMPOS NO SE GUARDARON EN LA BD');
        console.log('');
        console.log('DIAGNÓSTICO:');
        console.log('El problema está en el backend. Los campos no llegan al INSERT.');
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error en BD:', error.message);
  }
}

crearFactura();
