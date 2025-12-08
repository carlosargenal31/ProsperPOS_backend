const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

console.log('🔧 Corrigiendo errores críticos del POS...\n');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  // ==================== FIX 1: Agregar propiedades faltantes en data() ====================
  console.log('✓ Fix 1: Agregando propiedades showQuickPaymentModal y showDetailedPaymentModal');

  const oldData = `      productModelFilter: '',
      showAddCustomerModal: false`;

  const newData = `      productModelFilter: '',
      showAddCustomerModal: false,
      // Modales de pago
      showQuickPaymentModal: false,
      showDetailedPaymentModal: false,
      // Cobro rápido
      quickPayment: {
        method: 'EFECTIVO',
        sendToDispatch: false
      },
      // Cobro detallado
      detailedPayment: {
        paymentMethods: [],
        currentMethod: 'EFECTIVO',
        currentAmount: 0,
        currentReference: '',
        currentDate: new Date().toISOString().split('T')[0],
        clientBalance: 0
      },
      documentType: 'FACTURA'`;

  content = content.replace(oldData, newData);

  // ==================== FIX 2: Agregar computed properties faltantes ====================
  console.log('✓ Fix 2: Agregando computed properties subtotal, taxAmount, totalWithTax');

  const oldComputed = `    totals() {
      let itemCount = 0;
      let gross = 0;
      let subtotal = 0;
      let tax = 0;

      this.invoice.items.forEach(item => {
        itemCount += item.quantity;
        const itemGross = item.price * item.quantity;
        const itemDiscount = itemGross * (item.discount_percent / 100);
        const itemSubtotal = itemGross - itemDiscount;
        const itemTax = itemSubtotal * (item.tax_percent / 100);

        gross += itemGross;
        subtotal += itemSubtotal;
        tax += itemTax;
      });

      return { itemCount, gross, subtotal, tax, total: subtotal + tax };
    }`;

  const newComputed = `    subtotal() {
      return this.invoice.items.reduce((sum, item) => {
        const itemGross = item.price * item.quantity;
        const itemDiscount = itemGross * ((item.discount_percent || 0) / 100);
        return sum + (itemGross - itemDiscount);
      }, 0);
    },
    taxAmount() {
      const taxRate = this.invoice.tax_rate || 15;
      return this.subtotal * (taxRate / 100);
    },
    totalWithTax() {
      return this.subtotal + this.taxAmount - (this.invoice.discount || 0);
    },
    totals() {
      let itemCount = 0;
      let gross = 0;
      let subtotal = 0;
      let tax = 0;

      this.invoice.items.forEach(item => {
        itemCount += item.quantity;
        const itemGross = item.price * item.quantity;
        const itemDiscount = itemGross * (item.discount_percent / 100);
        const itemSubtotal = itemGross - itemDiscount;
        const itemTax = itemSubtotal * (item.tax_percent / 100);

        gross += itemGross;
        subtotal += itemSubtotal;
        tax += itemTax;
      });

      return { itemCount, gross, subtotal, tax, total: subtotal + tax };
    }`;

  content = content.replace(oldComputed, newComputed);

  // ==================== FIX 3: Agregar invoice.tax_rate y invoice.discount en data() ====================
  console.log('✓ Fix 3: Agregando invoice.tax_rate e invoice.discount');

  const oldInvoice = `      invoice: {
        consecutive: '0000031836',
        warehouse_id: null,
        is_delivery: false,
        items: []
      },`;

  const newInvoice = `      invoice: {
        consecutive: '0000031836',
        warehouse_id: null,
        is_delivery: false,
        items: [],
        tax_rate: 15,
        discount: 0
      },`;

  content = content.replace(oldInvoice, newInvoice);

  // ==================== FIX 4: Corregir loadVendors para manejar respuesta correctamente ====================
  console.log('✓ Fix 4: Corrigiendo loadVendors');

  const oldLoadVendors = `    async loadVendors() {
      try {
        const response = await api.get('/users');
        this.vendors = (response.data.data || []).map(u => ({
          id: u.id,
          code: u.id.toString(),
          name: u.name,
          agency: 'AGENCIA PRINCIPAL'
        }));
      } catch (error) {
        console.error('Error loading vendors:', error);
      }
    },`;

  const newLoadVendors = `    async loadVendors() {
      try {
        const response = await api.get('/users');
        const users = response.data.data || response.data || [];

        if (Array.isArray(users)) {
          this.vendors = users.map(u => ({
            id: u.id,
            code: u.id ? u.id.toString() : '',
            name: u.name || u.username || 'Sin nombre',
            agency: 'AGENCIA PRINCIPAL'
          }));
        } else {
          console.warn('Users response is not an array:', users);
          this.vendors = [];
        }
      } catch (error) {
        console.error('Error loading vendors:', error);
        this.vendors = [];
      }
    },`;

  content = content.replace(oldLoadVendors, newLoadVendors);

  // ==================== FIX 5: Arreglar tablas sin tbody ====================
  console.log('✓ Fix 5: Agregando tbody a tablas del modal de cobro detallado');

  // Tabla de resumen
  content = content.replace(
    '<table class="table table-sm table-borderless">\n                      <tr>',
    '<table class="table table-sm table-borderless">\n                      <tbody>\n                      <tr>'
  );

  content = content.replace(
    '</tr>\n                    </table>\n                    <hr>',
    '</tr>\n                      </tbody>\n                    </table>\n                    <hr>'
  );

  content = content.replace(
    '<hr>\n                    <table class="table table-sm table-borderless">\n                      <tr>',
    '<hr>\n                    <table class="table table-sm table-borderless">\n                      <tbody>\n                      <tr>'
  );

  content = content.replace(
    '</tr>\n                    </table>\n                  </div>',
    '</tr>\n                      </tbody>\n                    </table>\n                  </div>'
  );

  // ==================== FIX 6: Cambiar botones de cobro ====================
  console.log('✓ Fix 6: Cambiando botones de cobro');

  const oldButtons = `                  <button class="btn btn-success btn-lg" @click="processQuickPayment" :disabled="invoice.items.length === 0">
                    <i class="ti ti-currency-dollar me-2"></i>COBRO RÁPIDO
                  </button>
                  <button class="btn btn-success btn-lg" @click="processDetailedPayment" :disabled="invoice.items.length === 0">
                    <i class="ti ti-receipt-2 me-2"></i>COBRO DETALLADO
                  </button>`;

  const newButtons = `                  <button class="btn btn-success btn-lg" @click="showQuickPaymentModal = true" :disabled="invoice.items.length === 0">
                    <i class="ti ti-currency-dollar me-2"></i>COBRO RÁPIDO
                  </button>
                  <button class="btn btn-info btn-lg" @click="showDetailedPaymentModal = true" :disabled="invoice.items.length === 0">
                    <i class="ti ti-receipt-2 me-2"></i>COBRO DETALLADO
                  </button>`;

  content = content.replace(oldButtons, newButtons);

  // ==================== FIX 7: Eliminar métodos processQuickPayment y processDetailedPayment duplicados ====================
  console.log('✓ Fix 7: Eliminando métodos duplicados');

  // Encontrar y eliminar el primer processQuickPayment (el que usa Swal.fire para input)
  const duplicateQuickPayment = /async processQuickPayment\(\) \{[\s\S]*?await this\.saveInvoice\('paid', result\.value\.amount\);[\s\S]*?\},/;
  content = content.replace(duplicateQuickPayment, '');

  // Encontrar y eliminar el processDetailedPayment que solo muestra "en desarrollo"
  content = content.replace(
    `    async processDetailedPayment() {
      Swal.fire('Cobro Detallado', 'Funcionalidad en desarrollo', 'info');
    },`,
    ''
  );

  // Guardar archivo
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('\n✅ ERRORES CRÍTICOS CORREGIDOS\n');
  console.log('Resumen de cambios:');
  console.log('  ✓ Propiedades showQuickPaymentModal y showDetailedPaymentModal agregadas');
  console.log('  ✓ Computed properties subtotal, taxAmount, totalWithTax agregados');
  console.log('  ✓ invoice.tax_rate e invoice.discount agregados');
  console.log('  ✓ loadVendors corregido para manejar diferentes respuestas');
  console.log('  ✓ Tablas HTML corregidas con <tbody>');
  console.log('  ✓ Botones de cobro corregidos');
  console.log('  ✓ Métodos duplicados eliminados');
  console.log('\n🔄 Recarga la página del navegador para ver los cambios');

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
