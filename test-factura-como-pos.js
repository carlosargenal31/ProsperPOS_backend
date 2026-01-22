const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcHJvc3BlcnBvcy5jb20iLCJpYXQiOjE3Njg4NjQzNjUsImV4cCI6MTc2ODk1MDc2NX0.ObDohYWBaXJ7aYGhfOnje5aCARzcSGX1JEx_5q3vTDY';

async function crearFacturaComoPOS() {
  try {
    console.log('\n========================================');
    console.log('CREANDO FACTURA SIMULANDO POS FRONTEND');
    console.log('========================================\n');

    // Simular exactamente cómo el POS envía los datos
    const requestData = {
      invoice_data: {
        invoice_number: '000-002-01-00099999', // Número como lo genera el POS
        invoice_type: 'factura',
        customer_id: 1,
        customer_name: 'CLIENTE TEST CAMPOS',
        customer_rtn: '08011991237811',
        issue_date: new Date().toISOString().split('T')[0],
        warehouse_id: 1,
        seller_id: 1,
        seller_name: 'Admin ProsperPOS',
        payment_status: 'paid',
        paid_amount: 115,
        shipping_cost: 0,
        payment_method: 'efectivo',
        // CAMPOS ADICIONALES - ESTOS SON LOS QUE ESTAMOS PROBANDO
        orden_compra: 'OC-TEST-2026-001',
        constancia_exonerado: 'CONST-TEST-2026-002',
        registro_sag: 'SAG-TEST-2026-003'
      },
      items: [
        {
          product_id: 1,
          product_name: 'Producto de Prueba',
          product_sku: 'PROD001',
          quantity: 1,
          unit_price: 100,
          tax_rate: 15,
          discount_value: 0
        }
      ]
    };

    console.log('📦 Datos que se enviarán (igual que POS):');
    console.log(JSON.stringify(requestData, null, 2));
    console.log('\n⏳ Enviando al backend...\n');

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

    console.log('✅ RESPUESTA DEL SERVIDOR:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      const invoiceId = response.data.data.id;
      console.log(`\n✅ Factura creada exitosamente con ID: ${invoiceId}`);
      console.log(`   Número: ${response.data.data.invoice_number}`);

      // Verificar en la base de datos
      await verificarEnBD(invoiceId);
    }
  } catch (error) {
    console.error('\n❌ ERROR AL CREAR FACTURA:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
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
    console.log('VERIFICACIÓN EN BASE DE DATOS');
    console.log('========================================\n');

    const [rows] = await connection.query(`
      SELECT
        id,
        invoice_number,
        customer_name,
        orden_compra,
        constancia_exonerado,
        registro_sag,
        total,
        created_at
      FROM invoices
      WHERE id = ?
    `, [invoiceId]);

    if (rows.length > 0) {
      const inv = rows[0];
      console.log(`📄 Factura #${inv.id}`);
      console.log(`   Número: ${inv.invoice_number}`);
      console.log(`   Cliente: ${inv.customer_name}`);
      console.log(`   Total: L. ${inv.total}`);
      console.log(`   Fecha: ${inv.created_at}`);
      console.log('');
      console.log('📋 CAMPOS ADICIONALES:');
      console.log(`   Orden de Compra: "${inv.orden_compra}" ${inv.orden_compra ? '✅' : '❌'}`);
      console.log(`   Constancia Exonerado: "${inv.constancia_exonerado}" ${inv.constancia_exonerado ? '✅' : '❌'}`);
      console.log(`   Registro SAG: "${inv.registro_sag}" ${inv.registro_sag ? '✅' : '❌'}`);
      console.log('');

      if (inv.orden_compra && inv.constancia_exonerado && inv.registro_sag) {
        console.log('🎉🎉🎉 ¡PERFECTO! TODOS LOS CAMPOS SE GUARDARON CORRECTAMENTE 🎉🎉🎉');
        console.log('');
        console.log('✅ El sistema está funcionando igual que cotizaciones');
        console.log('✅ Los campos adicionales se guardan en la base de datos');
        console.log('✅ El flujo completo está operativo');
      } else {
        console.log('❌ ALGUNOS CAMPOS NO SE GUARDARON');
        console.log('');
        console.log('🔍 Esto significa que hay un problema en el backend');
      }
    } else {
      console.log('❌ No se encontró la factura en la base de datos');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error al verificar BD:', error.message);
  }
}

crearFacturaComoPOS();
