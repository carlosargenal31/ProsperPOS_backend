// ===================================================================
// SCRIPT PARA INSERTAR FACTURAS DESDE EXCEL
// ===================================================================

const XLSX = require('xlsx');
const path = require('path');
const mysql = require('mysql2/promise');

const excelPath = path.join(__dirname, '../Facturas ventas.xls');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '310104',
  database: 'prosperpos'
};

async function insertInvoices() {
  let connection;

  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Total de registros en Excel: ${data.length}`);

    // Filtrar encabezados y obtener solo las facturas
    const invoices = data.filter((row, index) => {
      // Saltar el primer registro que es el encabezado
      if (index === 0) return false;

      // Verificar que tenga número de factura
      return row.__EMPTY_1 && (
        row.__EMPTY_1.includes('FACTURA') ||
        row.__EMPTY_1.includes('DEVOLUCION')
      );
    });

    console.log(`Facturas válidas para insertar: ${invoices.length}`);

    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos');

    // Insertar facturas
    let insertedCount = 0;
    let skippedCount = 0;

    for (const invoice of invoices) {
      try {
        const emisionData = invoice['CERAMICAS TERRAZOS Y PULIDOS UNIVERSALCedula:01061977002516Agencia:AGENCIA PRINCIPALTeléfono:2440-0037Email:mauricio_argenal@hotmail.comDireccion:CASA MATRIZ, BARRIO LA MERCED, AVENIDA 14 DE JULIO ENTRE 15 Y 16 CALLE FRENTE A REPUESTOS DEL ATLáNTICO. LA CEIBA, ATLáNTIDA'];

        // Parsear fecha
        let invoiceDate = new Date();
        if (emisionData && typeof emisionData === 'string') {
          const dateParts = emisionData.split('\n')[0].split('/');
          if (dateParts.length === 3) {
            invoiceDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
          }
        }

        const invoiceNumber = invoice.__EMPTY_1 || '';
        const documentType = invoiceNumber.includes('DEVOLUCION') ? 'DEVOLUCION' : 'FACTURA';
        const agencia = invoice.__EMPTY || 'AGENCIA PRINCIPAL';
        const resolucion = invoice.__EMPTY_2 || '';
        const docAfectado = invoice.__EMPTY_3 || '';
        const cliente = invoice.__EMPTY_4 || 'CONSUMIDOR FINAL';
        const vendedor = invoice.__EMPTY_5 || 'DANIEL ARGEÑAL';
        const clienteId = invoice.__EMPTY_6 || 0;
        const estatus = invoice.__EMPTY_7 || 'COBRADO';
        const neto = parseFloat(invoice.__EMPTY_8) || 0;
        const impuesto = parseFloat(invoice.__EMPTY_9) || 0;
        const retencion = parseFloat(invoice.__EMPTY_10) || 0;
        const descuentos = parseFloat(invoice.__EMPTY_11) || 0;
        const recargos = parseFloat(invoice.__EMPTY_12) || 0;
        const total = parseFloat(invoice.__EMPTY_13) || 0;
        const devuelto = parseFloat(invoice.__EMPTY_14) || 0;
        const pagado = parseFloat(invoice.__EMPTY_15) || 0;
        const saldo = parseFloat(invoice.__EMPTY_16) || 0;

        // Determinar estado de pago
        let paymentStatus = 'Unpaid';
        if (pagado >= total && total > 0) {
          paymentStatus = 'Paid';
        } else if (pagado > 0 && pagado < total) {
          paymentStatus = 'Partial';
        } else if (saldo > 0 && pagado === 0) {
          paymentStatus = 'Unpaid';
        }

        // Determinar estado de factura
        let status = 'Completed';
        if (estatus.includes('DEVUELTO')) {
          status = 'Returned';
        } else if (estatus.includes('PENDIENTE')) {
          status = 'Pending';
        }

        const sql = `
          INSERT INTO invoices_sales (
            invoice_number, document_type, invoice_date, agency, resolution,
            affected_document, customer_name, customer_id_number, seller_name,
            status, payment_status, net_amount, tax_amount, retention_amount,
            discount_amount, surcharge_amount, total_amount, returned_amount,
            paid_amount, balance_amount, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await connection.execute(sql, [
          invoiceNumber,
          documentType,
          invoiceDate,
          agencia,
          resolucion,
          docAfectado,
          cliente,
          clienteId.toString(),
          vendedor,
          status,
          paymentStatus,
          neto,
          impuesto,
          retencion,
          descuentos,
          recargos,
          total,
          devuelto,
          pagado,
          saldo
        ]);

        insertedCount++;
        console.log(`✓ Insertada factura: ${invoiceNumber}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          skippedCount++;
          console.log(`⊘ Factura duplicada (omitida): ${invoice.__EMPTY_1}`);
        } else {
          console.error(`✗ Error insertando factura ${invoice.__EMPTY_1}:`, error.message);
        }
      }
    }

    console.log('\n===== RESUMEN =====');
    console.log(`Facturas insertadas: ${insertedCount}`);
    console.log(`Facturas omitidas (duplicadas): ${skippedCount}`);
    console.log(`Total procesado: ${insertedCount + skippedCount}`);

  } catch (error) {
    console.error('Error general:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada');
    }
  }
}

insertInvoices();
