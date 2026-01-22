const mysql = require('mysql2/promise');
require('dotenv').config();

async function testReprintAPI() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosper_pos'
    });

    console.log('✓ Conectado a MySQL\n');

    // Simular exactamente el query del controlador de reimpresión
    const invoiceId = 59; // La factura con "hola 19", "hola 29", "hola 39"

    const sql = `
      SELECT
        i.*,
        i.invoice_number as correlative,
        i.orden_compra,
        i.constancia_exonerado,
        i.registro_sag,
        b.nombre as branch_name,
        r.cai,
        r.numero_resolucion,
        r.nro_inicial_control,
        r.nro_final_control
      FROM invoices i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN resolutions r ON i.resolution_id = r.id
      WHERE i.id = ?
    `;

    const [results] = await connection.query(sql, [invoiceId]);

    if (results.length === 0) {
      console.log('❌ NO SE ENCONTRÓ la factura');
      await connection.end();
      return;
    }

    const invoice = results[0];

    console.log('=== SIMULACIÓN DE API REPRINT ===\n');
    console.log('Invoice ID:', invoice.id);
    console.log('Invoice Number:', invoice.invoice_number);
    console.log('Customer Name:', invoice.customer_name);
    console.log('\n--- CAMPOS ADICIONALES ---');
    console.log('orden_compra:', invoice.orden_compra);
    console.log('constancia_exonerado:', invoice.constancia_exonerado);
    console.log('registro_sag:', invoice.registro_sag);
    console.log('\n--- TIPO DE DATOS ---');
    console.log('typeof orden_compra:', typeof invoice.orden_compra);
    console.log('typeof constancia_exonerado:', typeof invoice.constancia_exonerado);
    console.log('typeof registro_sag:', typeof invoice.registro_sag);

    // Verificar si hay columnas duplicadas
    const keys = Object.keys(invoice);
    console.log('\n--- CLAVES DEL OBJETO ---');
    console.log('Total de propiedades:', keys.length);

    const camposAdicionales = keys.filter(k =>
      k.includes('orden') || k.includes('constancia') || k.includes('registro')
    );
    console.log('Campos relacionados:', camposAdicionales);

    await connection.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testReprintAPI();
