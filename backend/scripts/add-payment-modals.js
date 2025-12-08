const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

console.log('🔧 Agregando modales de pago (Cobro Rápido y Cobro Detallado)...\n');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  // ==================== PASO 1: Agregar propiedades al data() ====================
  console.log('✓ Agregando propiedades de pago al data()');

  const oldDataReturn = `      showAdditionalOptionsModal: false,
      productCodeInput: '',
      productQuantityInput: 1`;

  const newDataReturn = `      showAdditionalOptionsModal: false,
      productCodeInput: '',
      productQuantityInput: 1,
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
      }`;

  content = content.replace(oldDataReturn, newDataReturn);

  // ==================== PASO 2: Actualizar botones "Guardar" y "Cobrar" ====================
  console.log('✓ Actualizando botones de acción');

  const oldButtons = `                  <button class="btn btn-success btn-sm flex-fill" @click="saveInvoice">
                    <i class="ti ti-device-floppy"></i> Guardar
                  </button>
                  <button class="btn btn-primary btn-sm flex-fill" @click="processPayment">
                    <i class="ti ti-cash"></i> Cobrar
                  </button>`;

  const newButtons = `                  <button class="btn btn-success btn-sm flex-fill" @click="saveInvoice">
                    <i class="ti ti-device-floppy"></i> Guardar
                  </button>
                  <button class="btn btn-primary btn-sm flex-fill" @click="showQuickPaymentModal = true">
                    <i class="ti ti-cash"></i> Cobrar
                  </button>`;

  content = content.replace(oldButtons, newButtons);

  // ==================== PASO 3: Agregar modal de cobro rápido ====================
  console.log('✓ Agregando modal de cobro rápido');

  const quickPaymentModal = `
    <!-- Modal Cobro Rápido -->
    <div v-if="showQuickPaymentModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title text-white">Cobro Rápido</h5>
            <button type="button" class="btn-close" @click="showQuickPaymentModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-12">
                <h6 class="fw-bold mb-3">Método de Pago</h6>
                <div class="btn-group w-100" role="group">
                  <button
                    type="button"
                    class="btn"
                    :class="quickPayment.method === 'TRANSFERENCIA' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="quickPayment.method = 'TRANSFERENCIA'">
                    TRANSFERENCIA
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="quickPayment.method === 'CHEQUE' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="quickPayment.method = 'CHEQUE'">
                    CHEQUE
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="quickPayment.method === 'TARJ_DEBITO' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="quickPayment.method = 'TARJ_DEBITO'">
                    TARJ. DÉBITO
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="quickPayment.method === 'TARJ_CREDITO' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="quickPayment.method = 'TARJ_CREDITO'">
                    TARJ. CRÉDITO
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="quickPayment.method === 'EFECTIVO' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="quickPayment.method = 'EFECTIVO'">
                    EFECTIVO
                  </button>
                </div>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-12">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="sendToDispatch"
                    v-model="quickPayment.sendToDispatch">
                  <label class="form-check-label fw-bold" for="sendToDispatch">
                    Enviar a despacho
                  </label>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="card bg-light">
                  <div class="card-body">
                    <p class="mb-1"><strong>Total a Pagar:</strong></p>
                    <h3 class="text-primary mb-0">L {{ totalWithTax.toFixed(2) }}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card bg-light">
                  <div class="card-body">
                    <p class="mb-1"><strong>Método:</strong></p>
                    <h5 class="text-success mb-0">{{ quickPayment.method }}</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showQuickPaymentModal = false">
              Cancelar
            </button>
            <button type="button" class="btn btn-info" @click="switchToDetailedPayment">
              Cobro Detallado
            </button>
            <button type="button" class="btn btn-primary" @click="processQuickPayment">
              <i class="ti ti-check"></i> Procesar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
`;

  // ==================== PASO 4: Agregar modal de cobro detallado ====================
  console.log('✓ Agregando modal de cobro detallado');

  const detailedPaymentModal = `
    <!-- Modal Cobro Detallado -->
    <div v-if="showDetailedPaymentModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title text-white">Cobro Detallado</h5>
            <button type="button" class="btn-close" @click="showDetailedPaymentModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <!-- Resumen del documento -->
              <div class="col-md-4">
                <div class="card">
                  <div class="card-header bg-primary text-white">
                    <strong>Resumen del Documento</strong>
                  </div>
                  <div class="card-body">
                    <table class="table table-sm table-borderless">
                      <tr>
                        <td><strong>Subtotal:</strong></td>
                        <td class="text-end">L {{ subtotal.toFixed(2) }}</td>
                      </tr>
                      <tr>
                        <td><strong>Descuento:</strong></td>
                        <td class="text-end">L {{ invoice.discount.toFixed(2) }}</td>
                      </tr>
                      <tr>
                        <td><strong>ISV ({{ invoice.tax_rate }}%):</strong></td>
                        <td class="text-end">L {{ taxAmount.toFixed(2) }}</td>
                      </tr>
                      <tr class="border-top">
                        <td><strong>TOTAL:</strong></td>
                        <td class="text-end"><h5 class="text-primary mb-0">L {{ totalWithTax.toFixed(2) }}</h5></td>
                      </tr>
                    </table>
                    <hr>
                    <table class="table table-sm table-borderless">
                      <tr>
                        <td><strong>Total Pagado:</strong></td>
                        <td class="text-end text-success">L {{ totalPaid.toFixed(2) }}</td>
                      </tr>
                      <tr>
                        <td><strong>Pendiente:</strong></td>
                        <td class="text-end text-danger">L {{ remainingBalance.toFixed(2) }}</td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Agregar forma de pago -->
              <div class="col-md-8">
                <div class="card mb-3">
                  <div class="card-header bg-secondary text-white">
                    <strong>Agregar Forma de Pago</strong>
                  </div>
                  <div class="card-body">
                    <div class="row g-2 mb-3">
                      <div class="col-md-3">
                        <label class="form-label fw-bold">Método</label>
                        <select class="form-select form-select-sm" v-model="detailedPayment.currentMethod">
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="TRANSFERENCIA">Transferencia</option>
                          <option value="CHEQUE">Cheque</option>
                          <option value="TARJ_DEBITO">Tarjeta Débito</option>
                          <option value="TARJ_CREDITO">Tarjeta Crédito</option>
                        </select>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label fw-bold">Monto</label>
                        <input
                          type="number"
                          class="form-control form-control-sm"
                          v-model.number="detailedPayment.currentAmount"
                          placeholder="0.00"
                          step="0.01">
                      </div>
                      <div class="col-md-3">
                        <label class="form-label fw-bold">Referencia</label>
                        <input
                          type="text"
                          class="form-control form-control-sm"
                          v-model="detailedPayment.currentReference"
                          placeholder="Referencia">
                      </div>
                      <div class="col-md-2">
                        <label class="form-label fw-bold">Fecha</label>
                        <input
                          type="date"
                          class="form-control form-control-sm"
                          v-model="detailedPayment.currentDate">
                      </div>
                      <div class="col-md-1 d-flex align-items-end">
                        <button class="btn btn-success btn-sm w-100" @click="addPaymentMethod">
                          <i class="ti ti-plus"></i>
                        </button>
                      </div>
                    </div>

                    <!-- Lista de formas de pago agregadas -->
                    <div v-if="detailedPayment.paymentMethods.length > 0">
                      <h6 class="fw-bold mb-2">Formas de Pago Agregadas:</h6>
                      <table class="table table-sm table-bordered">
                        <thead class="table-light">
                          <tr>
                            <th>Método</th>
                            <th>Monto</th>
                            <th>Referencia</th>
                            <th>Fecha</th>
                            <th style="width: 50px;"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(payment, index) in detailedPayment.paymentMethods" :key="index">
                            <td>{{ payment.method }}</td>
                            <td>L {{ payment.amount.toFixed(2) }}</td>
                            <td>{{ payment.reference || 'N/A' }}</td>
                            <td>{{ payment.date }}</td>
                            <td>
                              <button class="btn btn-danger btn-sm" @click="removePaymentMethod(index)">
                                <i class="ti ti-trash"></i>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Información del cliente -->
                <div class="card">
                  <div class="card-header bg-info text-white">
                    <strong>Información del Cliente</strong>
                  </div>
                  <div class="card-body">
                    <div class="row g-2">
                      <div class="col-md-6">
                        <p class="mb-1"><strong>Nombre:</strong> {{ customerInfo.name || 'N/A' }}</p>
                        <p class="mb-1"><strong>RTN:</strong> {{ customerInfo.rtn || 'N/A' }}</p>
                      </div>
                      <div class="col-md-6">
                        <p class="mb-1"><strong>Teléfono:</strong> {{ customerInfo.phone || 'N/A' }}</p>
                        <p class="mb-1"><strong>Saldo Cliente:</strong> L {{ detailedPayment.clientBalance.toFixed(2) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDetailedPaymentModal = false">
              Cancelar
            </button>
            <button type="button" class="btn btn-info" @click="switchToQuickPayment">
              Cobro Rápido
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="processDetailedPayment"
              :disabled="remainingBalance > 0.01">
              <i class="ti ti-check"></i> Procesar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
`;

  // Insertar modales antes del cierre del template
  const templateEnd = '</template>';
  content = content.replace(templateEnd, quickPaymentModal + detailedPaymentModal + templateEnd);

  // ==================== PASO 5: Agregar computed properties ====================
  console.log('✓ Agregando computed properties para pagos');

  const oldComputedEnd = `    filteredVendors() {
      if (!Array.isArray(this.vendors)) return [];
      if (!this.vendorSearch) return this.vendors;
      const search = this.vendorSearch.toLowerCase();
      return this.vendors.filter(v => (v.name || '').toLowerCase().includes(search) || (v.code || '').toLowerCase().includes(search));
    }`;

  const newComputedEnd = `    filteredVendors() {
      if (!Array.isArray(this.vendors)) return [];
      if (!this.vendorSearch) return this.vendors;
      const search = this.vendorSearch.toLowerCase();
      return this.vendors.filter(v => (v.name || '').toLowerCase().includes(search) || (v.code || '').toLowerCase().includes(search));
    },
    totalPaid() {
      return this.detailedPayment.paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    },
    remainingBalance() {
      return Math.max(0, this.totalWithTax - this.totalPaid);
    }`;

  content = content.replace(oldComputedEnd, newComputedEnd);

  // ==================== PASO 6: Agregar métodos de pago ====================
  console.log('✓ Agregando métodos de procesamiento de pagos');

  const oldMethodsEnd = `    async searchCustomerByCode() {
      if (!this.customerInfo.code) return;

      const customer = this.customers.find(c => c.code === this.customerInfo.code);

      if (customer) {
        this.selectCustomer(customer);
      } else {
        this.customerInfo = {
          id: null,
          code: this.customerInfo.code,
          name: '',
          rtn: '',
          phone: ''
        };
      }
    },`;

  const newMethodsEnd = `    async searchCustomerByCode() {
      if (!this.customerInfo.code) return;

      const customer = this.customers.find(c => c.code === this.customerInfo.code);

      if (customer) {
        this.selectCustomer(customer);
      } else {
        this.customerInfo = {
          id: null,
          code: this.customerInfo.code,
          name: '',
          rtn: '',
          phone: ''
        };
      }
    },
    // ==================== MÉTODOS DE PAGO ====================
    switchToDetailedPayment() {
      this.showQuickPaymentModal = false;
      this.showDetailedPaymentModal = true;
    },
    switchToQuickPayment() {
      this.showDetailedPaymentModal = false;
      this.showQuickPaymentModal = true;
    },
    async processQuickPayment() {
      if (this.invoice.items.length === 0) {
        Swal.fire('Error', 'Debe agregar al menos un producto', 'error');
        return;
      }

      if (!this.customerInfo.id) {
        Swal.fire('Error', 'Debe seleccionar un cliente', 'error');
        return;
      }

      try {
        const invoiceData = {
          customer_id: this.customerInfo.id,
          warehouse_id: this.invoice.warehouse_id,
          seller_id: this.vendorInfo.id,
          invoice_date: this.invoice.date,
          payment_method: this.quickPayment.method,
          subtotal: this.subtotal,
          discount: this.invoice.discount,
          tax_rate: this.invoice.tax_rate,
          tax_amount: this.taxAmount,
          total: this.totalWithTax,
          notes: this.invoice.notes,
          send_to_dispatch: this.quickPayment.sendToDispatch,
          items: this.invoice.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            discount: item.discount,
            subtotal: item.subtotal
          }))
        };

        const response = await api.post('/sales', invoiceData);

        Swal.fire({
          icon: 'success',
          title: 'Pago Procesado',
          text: 'La factura ha sido guardada exitosamente',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.showQuickPaymentModal = false;
          this.resetInvoice();
        });

      } catch (error) {
        console.error('Error processing payment:', error);
        Swal.fire('Error', error.response?.data?.message || 'Error al procesar el pago', 'error');
      }
    },
    addPaymentMethod() {
      if (!this.detailedPayment.currentAmount || this.detailedPayment.currentAmount <= 0) {
        Swal.fire('Error', 'Debe ingresar un monto válido', 'error');
        return;
      }

      if (this.totalPaid + this.detailedPayment.currentAmount > this.totalWithTax) {
        Swal.fire('Error', 'El monto total excede el saldo a pagar', 'error');
        return;
      }

      this.detailedPayment.paymentMethods.push({
        method: this.detailedPayment.currentMethod,
        amount: this.detailedPayment.currentAmount,
        reference: this.detailedPayment.currentReference,
        date: this.detailedPayment.currentDate
      });

      // Reset form
      this.detailedPayment.currentAmount = 0;
      this.detailedPayment.currentReference = '';
      this.detailedPayment.currentDate = new Date().toISOString().split('T')[0];
    },
    removePaymentMethod(index) {
      this.detailedPayment.paymentMethods.splice(index, 1);
    },
    async processDetailedPayment() {
      if (this.invoice.items.length === 0) {
        Swal.fire('Error', 'Debe agregar al menos un producto', 'error');
        return;
      }

      if (!this.customerInfo.id) {
        Swal.fire('Error', 'Debe seleccionar un cliente', 'error');
        return;
      }

      if (this.detailedPayment.paymentMethods.length === 0) {
        Swal.fire('Error', 'Debe agregar al menos una forma de pago', 'error');
        return;
      }

      if (this.remainingBalance > 0.01) {
        Swal.fire('Error', 'El total pagado debe cubrir el monto de la factura', 'error');
        return;
      }

      try {
        const invoiceData = {
          customer_id: this.customerInfo.id,
          warehouse_id: this.invoice.warehouse_id,
          seller_id: this.vendorInfo.id,
          invoice_date: this.invoice.date,
          payment_methods: this.detailedPayment.paymentMethods,
          subtotal: this.subtotal,
          discount: this.invoice.discount,
          tax_rate: this.invoice.tax_rate,
          tax_amount: this.taxAmount,
          total: this.totalWithTax,
          notes: this.invoice.notes,
          items: this.invoice.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            discount: item.discount,
            subtotal: item.subtotal
          }))
        };

        const response = await api.post('/sales', invoiceData);

        Swal.fire({
          icon: 'success',
          title: 'Pago Procesado',
          text: 'La factura ha sido guardada exitosamente',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.showDetailedPaymentModal = false;
          this.resetInvoice();
        });

      } catch (error) {
        console.error('Error processing payment:', error);
        Swal.fire('Error', error.response?.data?.message || 'Error al procesar el pago', 'error');
      }
    },`;

  content = content.replace(oldMethodsEnd, newMethodsEnd);

  // Guardar archivo
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('\n✅ MODALES DE PAGO AGREGADOS EXITOSAMENTE\n');
  console.log('Resumen de cambios:');
  console.log('  ✓ Modal de Cobro Rápido agregado');
  console.log('  ✓ Modal de Cobro Detallado agregado');
  console.log('  ✓ Métodos de procesamiento de pagos implementados');
  console.log('  ✓ Validaciones de pago agregadas');
  console.log('  ✓ Integración con API de ventas');
  console.log('  ✓ Botón "Cobrar" ahora abre modal de cobro rápido');
  console.log('  ✓ Se puede cambiar entre cobro rápido y detallado');
  console.log('\n🔄 Recarga la página del navegador para ver los cambios');

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
