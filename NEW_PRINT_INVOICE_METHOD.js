// NUEVO MÉTODO printInvoice() PARA pos-invoice.vue
// Reemplazar el método printInvoice() existente (líneas 2645-2753) con este código

async printInvoice() {
  if (!this.createdInvoiceData) {
    console.error('No hay datos de factura para imprimir');
    return;
  }

  // Obtener datos adicionales de la resolución si es necesario
  let resolutionData = {
    cai: '2A9170-F8828A-8815E0-63BE03-090956-9D',
    prefijo_control: '000-002-01',
    nro_inicial_control: 30001,
    nro_final_control: 40000,
    fecha_fin: '2025-12-30'
  };

  // Intentar obtener la resolución activa del backend
  try {
    const response = await api.get('/resolutions/active');
    if (response.data && response.data.data) {
      resolutionData = response.data.data;
    }
  } catch (error) {
    console.warn('No se pudo obtener la resolución activa, usando datos por defecto');
  }

  // Construir filas de productos
  let tableRows = '';
  let subtotal = 0;
  let totalTax = 0;
  let taxableAmount = 0;

  this.createdInvoiceData.items.forEach((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price ||item.price) || 0;
    const taxRate = parseFloat(item.tax_rate) || 0;

    const itemSubtotal = qty * price;
    const itemTax = itemSubtotal * (taxRate / 100);
    const itemTotal = itemSubtotal + itemTax;

    if (taxRate > 0) {
      taxableAmount += itemSubtotal;
      totalTax += itemTax;
    }

    subtotal += itemSubtotal;

    tableRows += `
      <tr>
        <td style="padding: 3px; text-align: right; font-size: 13px;">${this.formatCurrency(qty)}</td>
        <td style="padding: 3px; font-size: 13px; line-height: 1.3;">${item.product_name || item.name}</td>
        <td style="padding: 3px; text-align: right; font-size: 13px;">${this.formatCurrency(price)}</td>
        <td style="padding: 3px; text-align: right; font-size: 13px;">${this.formatCurrency(itemTotal)}</td>
      </tr>
    `;
  });

  const discount = parseFloat(this.createdInvoiceData.discount || 0);
  const surcharge = parseFloat(this.createdInvoiceData.surcharge || 0);
  const grandTotal = this.createdInvoiceData.total || (subtotal + totalTax + surcharge - discount);

  // Logo en base64 (mismo que reprint.vue)
  const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>FACTURA - ${this.createdInvoiceData.invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: Arial, sans-serif;
          color: #000;
          background: #fff;
          padding: 0;
          margin: 0;
          font-size: 14px;
        }

        .invoice-container {
          max-width: 80mm;
          margin: 0 auto;
          background: white;
          padding: 12px 18px;
        }

        .header {
          text-align: center;
          margin-bottom: 2px;
        }

        .company-logo {
          margin-bottom: 8px;
        }

        .company-logo img {
          max-width: 120px;
          height: auto;
        }

        .company-name {
          font-size: 13px;
          font-weight: 700;
          color: #000;
          margin: 5px 0;
          text-transform: uppercase;
          line-height: 1.3;
        }

        .company-details {
          font-size: 13px;
          color: #000;
          line-height: 1.2;
        }

        .doc-title {
          font-size: 17px;
          font-weight: 700;
          text-align: center;
          margin: 2px 0;
          padding: 2px;
          color: #000;
          text-transform: uppercase;
        }

        .info-section {
          font-size: 14px;
          line-height: 1.2;
          margin: 2px 0;
          padding: 0;
          text-align: center;
        }

        .info-section strong {
          font-weight: 700;
        }

        .products-table {
          width: 100%;
          margin: 2px 0;
          border-collapse: collapse;
          font-size: 13px;
        }

        .products-table thead {
          background: none;
        }

        .products-table thead th {
          padding: 5px 4px;
          text-align: left;
          font-size: 13px;
          font-weight: 700;
          color: #000;
          border: none;
        }

        .products-table tbody td {
          padding: 5px 4px;
          font-size: 13px;
          vertical-align: top;
          border: none;
        }

        .totals-section {
          margin-top: 8px;
          padding-top: 0;
        }

        .totals-table {
          width: 100%;
          font-size: 13px;
          border-collapse: collapse;
        }

        .totals-table td {
          padding: 1px 4px;
          line-height: 1.1;
        }

        .totals-table .total-label {
          text-align: left;
          font-weight: 700;
          padding-right: 10px;
        }

        .totals-table .total-value {
          text-align: right;
          font-weight: 400;
          width: 90px;
        }

        .totals-table .grand-total {
          font-weight: 700;
          font-size: 15px;
        }

        .totals-table .grand-total td {
          padding-top: 4px;
          padding-bottom: 4px;
        }

        .payment-section {
          margin-top: 6px;
          font-size: 12px;
          line-height: 1.1;
          padding-top: 4px;
          text-align: center;
        }

        .payment-section strong {
          font-weight: 700;
        }

        .payment-section div {
          margin: 1px 0;
        }

        .footer-note {
          font-size: 12px;
          text-align: center;
          margin-top: 2px;
          line-height: 1.1;
          padding-top: 2px;
        }

        @media print {
          body { margin: 0; padding: 0; }
          .invoice-container { padding: 5px; }
          @page { size: 80mm auto; margin: 2mm; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="company-logo">
            <img src="${LOGO_BASE64}" alt="Logo">
          </div>
          <div class="company-name">CERAMICAS TERRAZOS Y PULIDOS<br>UNIVERSAL</div>
          <div class="company-details">
            <strong>RTN:</strong> 01061977002516<br>
            <strong>Dirección:</strong> Casa Matriz, Barrio La Merced,<br>
            Avenida 14 de Julio entre 15 y 16 calle frente a<br>
            Repuestos del Atlántico, La Ceiba, Atlántida<br>
            <strong>Teléfono de Empresa:</strong> 2440-0037<br>
            <strong>Teléfono Móvil:</strong> 9875-2725<br>
            mauricio_argenal@hotmail.com<br>
            <strong>CAI:</strong> ${resolutionData.cai || 'N/A'}
          </div>
        </div>

        <!-- Título del documento -->
        <div class="doc-title">FACTURA</div>

        <!-- Número e información del documento -->
        <div class="info-section">
          ${this.createdInvoiceData.invoice_number || '000-002-01-00000000'}<br>
          <strong>Condiciones de la Transacción:</strong> CONTADO<br>
          <strong>Cliente:</strong> ${this.customerInfo?.name || 'CONSUMIDOR FINAL'}<br>
          <strong>RTN:</strong> ${this.customerInfo?.rtn || '00000000000000'}<br>
          <strong>Vendedor:</strong> ${this.vendorInfo?.name || this.currentVendor?.first_name + ' ' + this.currentVendor?.last_name || 'VENDEDOR'}
        </div>

        <!-- Tabla de productos -->
        <table class="products-table">
          <thead>
            <tr>
              <td colspan="4" style="text-align: center; padding: 0; font-size: 12px; border: none;">.......................................................................................</td>
            </tr>
            <tr>
              <th style="width: 35px; text-align: center;">Cant</th>
              <th>Producto</th>
              <th style="width: 60px; text-align: right;">P/Unit</th>
              <th style="width: 65px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <!-- Totales -->
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td class="total-label">Importe Exonerado:</td>
              <td class="total-value">L 0.00</td>
            </tr>
            <tr>
              <td class="total-label">Importe Exento:</td>
              <td class="total-value">L 0.00</td>
            </tr>
            <tr>
              <td class="total-label">Gravado 15%</td>
              <td class="total-value">L ${this.formatCurrency(taxableAmount)}</td>
            </tr>
            <tr>
              <td class="total-label">Gravado 18%</td>
              <td class="total-value">L 0.00</td>
            </tr>
            <tr>
              <td class="total-label">I.S.V 15 15%:</td>
              <td class="total-value">L ${this.formatCurrency(totalTax)}</td>
            </tr>
            <tr>
              <td class="total-label">I.S.V 18 18%:</td>
              <td class="total-value">L 0.00</td>
            </tr>
            <tr>
              <td class="total-label">RECARGOS:</td>
              <td class="total-value">L ${this.formatCurrency(surcharge)}</td>
            </tr>
            <tr>
              <td class="total-label">DESCUENTOS Y REBAJAS OTORGADOS:</td>
              <td class="total-value">L 0.00</td>
            </tr>
            <tr class="grand-total">
              <td class="total-label"><strong>TOTAL A PAGAR:</strong></td>
              <td class="total-value"><strong>L<br>${this.formatCurrency(grandTotal)}</strong></td>
            </tr>
            <tr>
              <td colspan="2" style="text-align: center; padding: 0; font-size: 12px;">.......................................................................................</td>
            </tr>
          </table>
        </div>

        <!-- Información de pago -->
        <div class="payment-section">
          <strong>Pagos Recibidos</strong><br>
          <strong>Transferencia:</strong> ${this.formatCurrency(grandTotal)}<br>
          <strong>Valor en letras:</strong> ${(() => {
            const integerPart = Math.floor(grandTotal);
            const cents = String(Math.floor((grandTotal % 1) * 100)).padStart(2, '0');
            return this.numberToWords(integerPart).toUpperCase() + ' LEMPIRAS CON ' + cents + '/100';
          })()}<br>
          <strong>Rango de facturación Vigente:</strong><br>
          <strong>Desde:</strong> ${resolutionData.prefijo_control}-${String(resolutionData.nro_inicial_control).padStart(8, '0')}<br>
          <strong>Hasta:</strong> ${resolutionData.prefijo_control}-${String(resolutionData.nro_final_control).padStart(8, '0')}<br>
          <strong>Fecha Limite de Emisión Vigente:</strong> ${this.formatDate(resolutionData.fecha_fin) || '31/12/2025'}<br>
          <strong>No. Correlativo de la Orden de Compra<br>Exenta:</strong><br>
          <strong>No. Correlativo de la Constancia del Reg<br>Exonerado:</strong><br>
          <strong>No. Identificativo del Registro SAG:</strong><br>
          ${this.formatDateTime(new Date())}
        </div>

        <!-- Footer -->
        <div class="footer-note">
          <strong>Entrega:</strong> ${this.formatDate(new Date())}<br>
          Original: Cliente/Copia: Obligado Tributario<br>
          <strong>Emisor:</strong> ¡La Factura es beneficio de todos. Exígela!
        </div>
      </div>
    </body>
    </html>
  `;

  // Crear ventana de impresión
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
},

// TAMBIÉN AGREGAR ESTE MÉTODO numberToWords() después del método printInvoice()
numberToWords(num) {
  const units = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (num === 0) return 'CERO';

  const integer = Math.floor(num);

  if (integer < 10) return units[integer];
  if (integer < 20) return teens[integer - 10];
  if (integer < 100) {
    const ten = Math.floor(integer / 10);
    const unit = integer % 10;
    return tens[ten] + (unit > 0 ? ' Y ' + units[unit] : '');
  }
  if (integer < 1000) {
    const hundred = Math.floor(integer / 100);
    const remainder = integer % 100;
    let result = hundred === 1 && remainder === 0 ? 'CIEN' : hundreds[hundred];
    if (remainder > 0) {
      result += ' ' + this.numberToWords(remainder);
    }
    return result;
  }
  if (integer < 1000000) {
    const thousands = Math.floor(integer / 1000);
    const remainder = integer % 1000;
    let result = thousands === 1 ? 'MIL' : this.numberToWords(thousands) + ' MIL';
    if (remainder > 0) {
      result += ' ' + this.numberToWords(remainder);
    }
    return result;
  }
  if (integer < 1000000000) {
    const millions = Math.floor(integer / 1000000);
    const remainder = integer % 1000000;
    let result = millions === 1 ? 'UN MILLÓN' : this.numberToWords(millions) + ' MILLONES';
    if (remainder > 0) {
      result += ' ' + this.numberToWords(remainder);
    }
    return result;
  }

  return 'NÚMERO MUY GRANDE';
},
