const fs = require('fs');
const path = require('path');

const newPosInvoiceContent = `<template>
  <div class="pos-invoice-wrapper">
    <!-- Header -->
    <div class="header-pos">
      <div class="container-fluid">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <router-link to="/dashboard/admin-dashboard" class="btn btn-icon btn-back">
              <i class="ti ti-arrow-left"></i>
            </router-link>
            <div>
              <h5 class="mb-0">POS Facturación</h5>
              <p class="mb-0 small text-muted">{{ currentDate }}</p>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-primary" @click="toggleDocumentType">
              <i class="ti ti-file-text me-1"></i>
              {{ documentType === 'FACTURA' ? 'FACTURA' : 'COTIZACIÓN' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="pos-content-main">
      <div class="container-fluid h-100">
        <div class="row g-2 h-100">

          <!-- LEFT COLUMN -->
          <div class="col-lg-8 d-flex flex-column">

            <!-- Invoice Info (Compact) -->
            <div class="card mb-2 flex-shrink-0">
              <div class="card-body p-2">
                <div class="row g-2">
                  <div class="col-md-3">
                    <div class="info-mini">
                      <label class="label-tiny">Consecutivo</label>
                      <div class="d-flex align-items-center gap-1">
                        <span class="badge bg-danger badge-sm">{{ documentType === 'FACTURA' ? 'FAC' : 'COT' }}</span>
                        <strong class="text-sm">{{ invoice.consecutive }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="info-mini">
                      <label class="label-tiny">No. Resolución</label>
                      <strong class="text-sm">{{ resolution.cai }}</strong>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="info-mini">
                      <label class="label-tiny">Consec. Resolución</label>
                      <strong class="text-sm text-primary">{{ invoiceNumber }}</strong>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="info-mini">
                      <label class="label-tiny">Documento</label>
                      <select class="form-select form-select-sm" v-model="documentType">
                        <option value="FACTURA">FACTURA</option>
                        <option value="COTIZACION">COTIZACIÓN</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Client, Warehouse, Seller -->
            <div class="card mb-2 flex-shrink-0">
              <div class="card-body p-2">
                <div class="row g-2">
                  <div class="col-md-5">
                    <label class="label-tiny">Cliente</label>
                    <div class="input-group input-group-sm">
                      <button class="btn btn-info btn-sm" @click="showCustomerModal = true">
                        <i class="ti ti-search"></i>
                      </button>
                      <input type="text" class="form-control form-control-sm" v-model="customerInfo.code" placeholder="Código" readonly style="max-width: 80px;">
                      <input type="text" class="form-control form-control-sm flex-grow-1" v-model="customerInfo.name" placeholder="Nombre" readonly>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <label class="label-tiny">Almacén</label>
                    <div class="input-group input-group-sm">
                      <button class="btn btn-info btn-sm" @click="focusWarehouse">
                        <i class="ti ti-search"></i>
                      </button>
                      <select class="form-select form-select-sm" v-model="invoice.warehouse_id" ref="warehouseSelect">
                        <option v-for="w in warehouses" :key="w.value" :value="w.value">{{ w.label }}</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="label-tiny">Vendedor</label>
                    <div class="input-group input-group-sm">
                      <button class="btn btn-info btn-sm" @click="showVendorModal = true">
                        <i class="ti-search"></i>
                      </button>
                      <input type="text" class="form-control form-control-sm" v-model="currentVendor.name" readonly>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Product Search -->
            <div class="card mb-2 flex-shrink-0">
              <div class="card-body p-2">
                <div class="row g-2">
                  <div class="col-md-4">
                    <label class="label-tiny">Código de Artículo</label>
                    <div class="input-group input-group-sm">
                      <button class="btn btn-info btn-sm" @click="showProductModal = true">
                        <i class="ti ti-search"></i>
                      </button>
                      <input type="text" class="form-control form-control-sm" v-model="currentProduct.code" @keypress.enter="searchProductByCode" placeholder="Código" ref="productCodeInput">
                      <button class="btn btn-success btn-sm">
                        <i class="ti ti-plus"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="label-tiny">Nombre Artículo</label>
                    <input type="text" class="form-control form-control-sm" v-model="currentProduct.name" readonly>
                  </div>
                  <div class="col-md-2">
                    <label class="label-tiny">Cantidad</label>
                    <input type="number" class="form-control form-control-sm text-center" v-model.number="currentProduct.quantity" step="0.01" min="0.01">
                  </div>
                  <div class="col-md-1">
                    <label class="label-tiny">Ordenar</label>
                    <select class="form-select form-select-sm">
                      <option>↓</option>
                    </select>
                  </div>
                  <div class="col-md-1">
                    <label class="label-tiny">&nbsp;</label>
                    <button class="btn btn-success btn-sm w-100" @click="addProduct">
                      <small>ADICIONAR</small>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Products Table -->
            <div class="card products-table-card flex-grow-1">
              <div class="card-body p-0 h-100">
                <div class="table-wrapper">
                  <table class="table table-sm table-hover mb-0">
                    <thead class="table-light sticky-top">
                      <tr>
                        <th style="width: 3%;"></th>
                        <th style="width: 3%;"></th>
                        <th style="width: 3%;"></th>
                        <th style="width: 10%;">ALMACEN</th>
                        <th style="width: 10%;">P.UNIT.</th>
                        <th style="width: 25%;">DESC.UNIT.</th>
                        <th style="width: 8%;">CANTIDAD</th>
                        <th style="width: 8%;">DESC%</th>
                        <th style="width: 10%;">IMPUESTOS</th>
                        <th style="width: 12%;">TOTAL</th>
                        <th style="width: 3%;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in invoice.items" :key="index">
                        <td class="text-center">
                          <button class="btn btn-sm btn-link text-danger p-0" @click="removeProduct(index)">
                            <i class="ti ti-trash"></i>
                          </button>
                        </td>
                        <td class="text-center">
                          <button class="btn btn-sm btn-link text-primary p-0" @click="editProduct(index)">
                            <i class="ti ti-pencil"></i>
                          </button>
                        </td>
                        <td class="text-center">
                          <button class="btn btn-sm btn-link text-info p-0">
                            <i class="ti ti-copy"></i>
                          </button>
                        </td>
                        <td>{{ getWarehouseName(item.warehouse_id) }}</td>
                        <td class="text-end">{{ formatCurrency(item.price) }}</td>
                        <td>{{ item.name }}</td>
                        <td>
                          <input type="number" class="form-control form-control-sm text-center" v-model.number="item.quantity" @input="calculateItemTotal(index)" step="0.01">
                        </td>
                        <td>
                          <input type="number" class="form-control form-control-sm text-center" v-model.number="item.discount_percent" @input="calculateItemTotal(index)" min="0" max="100">
                        </td>
                        <td class="text-center">
                          <span class="badge bg-info">{{ item.tax_percent }}%</span>
                        </td>
                        <td class="text-end fw-bold">{{ formatCurrency(item.total) }}</td>
                        <td class="text-center">
                          <input type="checkbox" class="form-check-input">
                        </td>
                      </tr>
                      <tr v-if="invoice.items.length === 0">
                        <td colspan="11" class="text-center py-4 text-muted">
                          <i class="ti ti-shopping-cart-off fs-2"></i>
                          <p class="mt-2 mb-0">No hay productos agregados</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Bottom Actions Bar -->
            <div class="card mt-2 flex-shrink-0">
              <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="text-sm">
                    <strong>Total ({{ invoice.items.length }}) Registros</strong>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-warning btn-sm" @click="showAdditionalOptions = true">
                      <i class="ti ti-settings me-1"></i>OPCIONES ADICIONALES
                    </button>
                    <button class="btn btn-info btn-sm" @click="showAdditionalFields = true">
                      <i class="ti ti-list me-1"></i>CAMPOS ADICIONALES
                    </button>
                  </div>
                  <div>
                    <label class="form-check-label me-2">
                      <input class="form-check-input me-1" type="checkbox" v-model="invoice.is_delivery">
                      ES PARA LLEVAR
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN - Totals & Actions -->
          <div class="col-lg-4 d-flex flex-column">

            <!-- Totals Card -->
            <div class="card totals-card mb-2 flex-shrink-0">
              <div class="card-header bg-primary text-white py-2">
                <h6 class="mb-0"><i class="ti ti-calculator me-2"></i>RESUMEN</h6>
              </div>
              <div class="card-body p-3">
                <div class="total-row">
                  <span>CANT. ARTICULOS:</span>
                  <strong>{{ totals.itemCount.toFixed(2) }}</strong>
                </div>
                <div class="total-row">
                  <span>MONTO BRUTO:</span>
                  <strong>L {{ formatCurrency(totals.gross) }}</strong>
                </div>
                <div class="total-row">
                  <span>SUBTOTAL:</span>
                  <strong>L {{ formatCurrency(totals.subtotal) }}</strong>
                </div>
                <div class="total-row">
                  <span>ISV:</span>
                  <strong>L {{ formatCurrency(totals.tax) }}</strong>
                </div>
                <hr class="my-2">
                <div class="total-final">
                  <span class="fs-5 fw-bold">TOTAL</span>
                  <span class="fs-4 fw-bold text-danger">L {{ formatCurrency(totals.total) }}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="card flex-shrink-0">
              <div class="card-body p-2">
                <div class="d-grid gap-2">
                  <button class="btn btn-danger btn-lg" @click="clearInvoice">
                    <i class="ti ti-trash me-2"></i>ELIMINAR
                  </button>
                  <button class="btn btn-warning btn-lg" @click="saveAsDraft" :disabled="invoice.items.length === 0">
                    <i class="ti ti-device-floppy me-2"></i>GUARDAR
                  </button>
                  <button class="btn btn-success btn-lg" @click="processQuickPayment" :disabled="invoice.items.length === 0">
                    <i class="ti ti-currency-dollar me-2"></i>COBRO RÁPIDO
                  </button>
                  <button class="btn btn-success btn-lg" @click="processDetailedPayment" :disabled="invoice.items.length === 0">
                    <i class="ti ti-receipt-2 me-2"></i>COBRO DETALLADO
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Modals will be added here -->
    <!-- Customer Modal, Product Modal, Vendor Modal, etc. -->

  </div>
</template>

<script>
import api from '@/api/config';
import Swal from 'sweetalert2';

export default {
  name: 'POSInvoice',
  data() {
    return {
      documentType: 'FACTURA',
      currentDate: new Date().toLocaleDateString('es-HN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      currentVendor: {
        id: null,
        code: '1',
        name: 'CARLOS ARGEÑAL'
      },
      invoice: {
        consecutive: '0000031836',
        warehouse_id: null,
        is_delivery: false,
        items: []
      },
      resolution: {
        cai: '2A9170-F8828A-8815E0-63BE03-090956-9D',
        prefix: '000-002-01-',
        current: 31836
      },
      customerInfo: {
        id: 1,
        code: '000001',
        name: 'CONSUMIDOR FINAL',
        rtn: '',
        phone: ''
      },
      currentProduct: {
        code: '',
        name: '',
        quantity: 1,
        price: 0,
        discount_percent: 0,
        tax_percent: 15
      },
      customers: [],
      products: [],
      warehouses: [],
      vendors: [],
      showCustomerModal: false,
      showProductModal: false,
      showVendorModal: false,
      showAdditionalFields: false,
      showAdditionalOptions: false
    };
  },
  computed: {
    invoiceNumber() {
      return \`\${this.resolution.prefix}\${String(this.resolution.current).padStart(8, '0')}\`;
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
    }
  },
  mounted() {
    this.loadInitialData();
    this.focusProductInput();
  },
  methods: {
    async loadInitialData() {
      await Promise.all([
        this.loadCustomers(),
        this.loadProducts(),
        this.loadWarehouses()
      ]);
    },
    async loadCustomers() {
      try {
        const response = await api.get('/customers');
        this.customers = (response.data.data || []).map(c => ({
          label: c.name,
          value: c.id,
          code: c.customer_code || '',
          rtn: c.rtn || '',
          phone: c.phone || ''
        }));
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    },
    async loadProducts() {
      try {
        const response = await api.get('/products');
        this.products = response.data.data || [];
      } catch (error) {
        console.error('Error loading products:', error);
      }
    },
    async loadWarehouses() {
      try {
        const response = await api.get('/warehouses');
        this.warehouses = (response.data.data || []).map(w => ({
          label: w.name,
          value: w.id
        }));
        if (this.warehouses.length > 0) {
          this.invoice.warehouse_id = this.warehouses[0].value;
        }
      } catch (error) {
        console.error('Error loading warehouses:', error);
      }
    },
    toggleDocumentType() {
      this.documentType = this.documentType === 'FACTURA' ? 'COTIZACION' : 'FACTURA';
    },
    async searchProductByCode() {
      if (!this.currentProduct.code) return;

      const product = this.products.find(p =>
        p.sku === this.currentProduct.code || p.barcode === this.currentProduct.code
      );

      if (product) {
        this.currentProduct.name = product.name;
        this.currentProduct.price = product.sale_price || 0;
        this.currentProduct.product_id = product.id;
        this.currentProduct.quantity = 1;
        setTimeout(() => this.addProduct(), 100);
      } else {
        Swal.fire('No encontrado', 'Producto no encontrado', 'warning');
      }
    },
    addProduct() {
      if (!this.currentProduct.code || this.currentProduct.quantity <= 0) {
        Swal.fire('Error', 'Complete los datos del producto', 'error');
        return;
      }

      const itemGross = this.currentProduct.price * this.currentProduct.quantity;
      const itemDiscount = itemGross * (this.currentProduct.discount_percent / 100);
      const itemSubtotal = itemGross - itemDiscount;
      const itemTax = itemSubtotal * (this.currentProduct.tax_percent / 100);

      this.invoice.items.push({
        product_id: this.currentProduct.product_id,
        warehouse_id: this.invoice.warehouse_id,
        code: this.currentProduct.code,
        name: this.currentProduct.name,
        price: this.currentProduct.price,
        quantity: this.currentProduct.quantity,
        discount_percent: this.currentProduct.discount_percent || 0,
        tax_percent: this.currentProduct.tax_percent,
        total: itemSubtotal + itemTax
      });

      this.currentProduct = {
        code: '',
        name: '',
        quantity: 1,
        price: 0,
        discount_percent: 0,
        tax_percent: 15
      };

      this.focusProductInput();
    },
    removeProduct(index) {
      this.invoice.items.splice(index, 1);
    },
    editProduct(index) {
      const item = this.invoice.items[index];
      this.currentProduct = { ...item };
      this.invoice.items.splice(index, 1);
    },
    calculateItemTotal(index) {
      const item = this.invoice.items[index];
      const itemGross = item.price * item.quantity;
      const itemDiscount = itemGross * (item.discount_percent / 100);
      const itemSubtotal = itemGross - itemDiscount;
      const itemTax = itemSubtotal * (item.tax_percent / 100);
      item.total = itemSubtotal + itemTax;
    },
    async processQuickPayment() {
      const result = await Swal.fire({
        title: 'Cobro Rápido',
        html: \`<h3>Total: L \${this.formatCurrency(this.totals.total)}</h3>
          <input type="number" id="amountReceived" class="form-control mt-3" value="\${this.totals.total}">\`,
        showCancelButton: true,
        confirmButtonText: 'Procesar',
        preConfirm: () => {
          const amount = parseFloat(document.getElementById('amountReceived').value);
          if (amount < this.totals.total) {
            Swal.showValidationMessage('Monto insuficiente');
            return false;
          }
          return { amount };
        }
      });

      if (result.isConfirmed) {
        await this.saveInvoice('paid', result.value.amount);
      }
    },
    async processDetailedPayment() {
      Swal.fire('Cobro Detallado', 'Funcionalidad en desarrollo', 'info');
    },
    async saveAsDraft() {
      await this.saveInvoice('draft');
    },
    async saveInvoice(status = 'paid', amountReceived = 0) {
      try {
        const invoiceData = {
          invoice_number: this.invoiceNumber,
          document_type: this.documentType,
          customer_id: this.customerInfo.id,
          warehouse_id: this.invoice.warehouse_id,
          seller_id: this.currentVendor.id,
          items: this.invoice.items,
          subtotal: this.totals.subtotal,
          tax: this.totals.tax,
          total: this.totals.total,
          status: status
        };

        await api.post('/billing/invoices', invoiceData);

        if (status === 'paid') {
          const change = amountReceived - this.totals.total;
          Swal.fire({
            icon: 'success',
            title: 'Pago Procesado',
            html: \`<p>Cambio: L \${this.formatCurrency(change)}</p>\`
          });
        } else {
          Swal.fire('Guardado', 'Factura guardada', 'success');
        }

        this.clearInvoice();
        this.resolution.current++;
      } catch (error) {
        Swal.fire('Error', 'Error al guardar la factura', 'error');
      }
    },
    clearInvoice() {
      this.invoice.items = [];
      this.currentProduct = {
        code: '',
        name: '',
        quantity: 1,
        price: 0,
        discount_percent: 0,
        tax_percent: 15
      };
    },
    focusProductInput() {
      this.$nextTick(() => {
        if (this.$refs.productCodeInput) {
          this.$refs.productCodeInput.focus();
        }
      });
    },
    focusWarehouse() {
      if (this.$refs.warehouseSelect) {
        this.$refs.warehouseSelect.focus();
      }
    },
    getWarehouseName(warehouseId) {
      const warehouse = this.warehouses.find(w => w.value === warehouseId);
      return warehouse ? warehouse.label : 'N/A';
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('es-HN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0);
    }
  }
};
</script>

<style scoped>
.pos-invoice-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.header-pos {
  background: #fff;
  padding: 0.75rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  flex-shrink: 0;
}

.btn-back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.pos-content-main {
  flex: 1;
  overflow: hidden;
  padding: 0.5rem 0;
}

.label-tiny {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.25rem;
  display: block;
}

.text-sm {
  font-size: 0.85rem;
}

.info-mini {
  background: #fff;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #e0e4e8;
}

.badge-sm {
  font-size: 0.65rem;
  padding: 0.25rem 0.4rem;
}

.card {
  border: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border-radius: 8px;
}

.products-table-card {
  min-height: 0;
}

.table-wrapper {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.table thead.sticky-top {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f8f9fa;
}

.table-sm th,
.table-sm td {
  padding: 0.4rem;
  font-size: 0.85rem;
  vertical-align: middle;
}

.totals-card .total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
}

.totals-card .total-final {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
}
</style>
`;

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

try {
  fs.writeFileSync(targetPath, newPosInvoiceContent, 'utf8');
  console.log('✓ Archivo pos-invoice.vue actualizado exitosamente');
  console.log(`✓ Ubicación: ${targetPath}`);
} catch (error) {
  console.error('✗ Error al actualizar el archivo:', error.message);
  process.exit(1);
}
