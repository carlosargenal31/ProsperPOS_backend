const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

// Leer el archivo actual
let content = fs.readFileSync(targetPath, 'utf8');

// Buscar donde insertar los modales (antes del cierre del template)
const modalsHTML = `
    <!-- Modal: Búsqueda de Cliente -->
    <div v-if="showCustomerModal" class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">Busqueda de datos</h5>
            <button type="button" class="btn-close btn-close-white" @click="showCustomerModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-3">
                <label class="form-label fw-bold">Buscar por:</label>
                <select class="form-select form-select-sm" v-model="customerSearchBy">
                  <option value="name">Nombre</option>
                  <option value="code">Código</option>
                  <option value="rtn">RTN</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Ordenar Por:</label>
                <select class="form-select form-select-sm" v-model="customerSortBy">
                  <option value="name">Nombre (A-Z)</option>
                  <option value="code">Código</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">&nbsp;</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text"><i class="ti ti-search"></i></span>
                  <input type="text" class="form-control" v-model="customerSearch" placeholder="Buscar..." @input="customerPage = 1">
                </div>
              </div>
            </div>

            <div class="table-responsive" style="max-height: 400px;">
              <table class="table table-hover table-sm">
                <thead class="table-light sticky-top">
                  <tr>
                    <th style="width: 10%;">Info</th>
                    <th style="width: 15%;">Código</th>
                    <th style="width: 60%;">Nombre</th>
                    <th style="width: 15%;" class="text-center">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="customer in paginatedCustomers" :key="customer.value" @click="selectCustomer(customer)" style="cursor: pointer;">
                    <td class="text-center">
                      <button class="btn btn-sm btn-outline-secondary" @click.stop="viewCustomerInfo(customer)">+ INFO</button>
                    </td>
                    <td>{{ customer.code }}</td>
                    <td>{{ customer.label }}</td>
                    <td class="text-center">
                      <span class="badge bg-success">ACTIVO</span>
                    </td>
                  </tr>
                  <tr v-if="filteredCustomers.length === 0">
                    <td colspan="4" class="text-center text-muted py-4">No se encontraron clientes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-success" @click="showAddCustomerModal = true; showCustomerModal = false;">
              <i class="ti ti-plus me-1"></i>Nuevo Cliente
            </button>
            <button type="button" class="btn btn-secondary" @click="showCustomerModal = false">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Nuevo Cliente -->
    <div v-if="showAddCustomerModal" class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">Documentos Ventas - Nuevo Cliente</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeAddCustomerModal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label fw-bold">Código</label>
                <div class="input-group">
                  <input type="text" class="form-control" v-model="newCustomer.code" placeholder="Código">
                  <button class="btn btn-outline-secondary" title="Usar Consecutivos">
                    <input type="checkbox" class="form-check-input" v-model="newCustomer.useConsecutive">
                  </button>
                  <button class="btn btn-outline-secondary" title="Refrescar">
                    <i class="ti ti-refresh"></i>
                  </button>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Razón Social</label>
                <input type="text" class="form-control" v-model="newCustomer.razon_social" placeholder="Razón Social">
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Tipo de Beneficiario</label>
                <select class="form-select" v-model="newCustomer.beneficiary_type">
                  <option value="JURIDICA_DOMICILIADA">JURIDICA DOMICILIADA</option>
                  <option value="NATURAL_DOMICILIADA">NATURAL DOMICILIADA</option>
                  <option value="JURIDICA_NO_DOMICILIADA">JURIDICA NO DOMICILIADA</option>
                  <option value="NATURAL_NO_DOMICILIADA">NATURAL NO DOMICILIADA</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Nombre Comercial</label>
                <input type="text" class="form-control" v-model="newCustomer.nombre_comercial" placeholder="Nombre Comercial">
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Tipo Identificación</label>
                <select class="form-select" v-model="newCustomer.tipo_identificacion">
                  <option value="CEDULA">CEDULA</option>
                  <option value="RTN">RTN</option>
                  <option value="PASAPORTE">PASAPORTE</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">CEDULA</label>
                <input type="text" class="form-control" v-model="newCustomer.cedula" placeholder="CEDULA">
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">SAR (ID fiscal #2)</label>
                <input type="text" class="form-control" v-model="newCustomer.sar" placeholder="SAR">
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Tipo de Cliente</label>
                <select class="form-select" v-model="newCustomer.tipo_cliente">
                  <option value="NACIONAL">NACIONAL</option>
                  <option value="EXTRANJERO">EXTRANJERO</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Tipo de Contribuyente</label>
                <select class="form-select" v-model="newCustomer.tipo_contribuyente">
                  <option value="CONTRIBUYENTE">CONTRIBUYENTE</option>
                  <option value="NO_CONTRIBUYENTE">NO CONTRIBUYENTE</option>
                  <option value="EXONERADO">EXONERADO</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Email</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="ti ti-mail"></i></span>
                  <input type="email" class="form-control" v-model="newCustomer.email" placeholder="Email">
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Teléfono</label>
                <input type="text" class="form-control" v-model="newCustomer.phone" placeholder="Teléfono">
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Teléfono Móvil</label>
                <input type="text" class="form-control" v-model="newCustomer.mobile" placeholder="Teléfono Móvil">
              </div>
              <div class="col-md-12">
                <label class="form-label fw-bold">Dirección</label>
                <textarea class="form-control" rows="2" v-model="newCustomer.address" placeholder="Dirección..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAddCustomerModal">CERRAR</button>
            <button type="button" class="btn btn-success" @click="saveNewCustomer">
              <i class="ti ti-device-floppy me-1"></i>GUARDAR
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Búsqueda de Productos -->
    <div v-if="showProductModal" class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-fullscreen">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">Busqueda de datos - Productos</h5>
            <button type="button" class="btn-close btn-close-white" @click="showProductModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-2">
                <label class="form-label fw-bold">Buscar por:</label>
                <select class="form-select form-select-sm" v-model="productSearchBy">
                  <option value="name">Nombre</option>
                  <option value="code">Código</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label fw-bold">Ordenar Por:</label>
                <select class="form-select form-select-sm" v-model="productSortBy">
                  <option value="name">Nombre (A-Z)</option>
                  <option value="code">Código</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">&nbsp;</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text"><i class="ti ti-search"></i></span>
                  <input type="text" class="form-control" v-model="productSearch" placeholder="Buscar..." @input="productPage = 1">
                </div>
              </div>
              <div class="col-md-2">
                <label class="form-label fw-bold">Tipo Item</label>
                <select class="form-select form-select-sm" v-model="productTypeFilter">
                  <option value="">Todos</option>
                  <option value="product">Producto</option>
                  <option value="service">Servicio</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-bold">Existencias</label>
                <select class="form-select form-select-sm" v-model="productStockFilter">
                  <option value="">Todos</option>
                  <option value="in_stock">Con Stock</option>
                  <option value="out_of_stock">Sin Stock</option>
                </select>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label fw-bold">Seleccione un Grupo</label>
                <select class="form-select form-select-sm" v-model="productGroupFilter">
                  <option value="">Todos los Grupos</option>
                  <option v-for="group in productGroups" :key="group" :value="group">{{ group }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-bold">Seleccione una Marca</label>
                <select class="form-select form-select-sm" v-model="productBrandFilter">
                  <option value="">Todas las Marcas</option>
                  <option v-for="brand in productBrands" :key="brand" :value="brand">{{ brand }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-bold">Seleccione un Modelo</label>
                <select class="form-select form-select-sm" v-model="productModelFilter">
                  <option value="">Todos los Modelos</option>
                  <option v-for="model in productModels" :key="model" :value="model">{{ model }}</option>
                </select>
              </div>
            </div>

            <div class="table-responsive" style="max-height: 450px;">
              <table class="table table-hover table-sm table-bordered">
                <thead class="table-light sticky-top">
                  <tr>
                    <th style="width: 5%;">Info</th>
                    <th style="width: 8%;">IMG</th>
                    <th style="width: 10%;">Código</th>
                    <th style="width: 30%;">Item</th>
                    <th style="width: 15%;">Grupo/Subgrupo</th>
                    <th style="width: 10%;" class="text-center">Existencias</th>
                    <th style="width: 12%;" class="text-end">Precio Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in paginatedProducts" :key="product.id" @dblclick="selectProduct(product)" style="cursor: pointer;">
                    <td class="text-center">
                      <button class="btn btn-sm btn-outline-secondary" @click="selectProduct(product)">+ INFO</button>
                    </td>
                    <td class="text-center">
                      <div class="product-img-mini">
                        <span class="text-muted small">NO<br>DISPONIBLE</span>
                      </div>
                    </td>
                    <td>{{ product.sku }}</td>
                    <td>{{ product.name }}</td>
                    <td>
                      <small class="text-primary">{{ product.category_name || 'ACCESORIOS' }}</small><br>
                      <small class="text-muted">{{ product.subcategory_name || 'GENERAL' }}</small>
                    </td>
                    <td class="text-center">
                      <span :class="product.stock > 0 ? 'text-success fw-bold' : 'text-danger'">
                        {{ formatNumber(product.stock || 0) }}
                      </span>
                    </td>
                    <td class="text-end fw-bold">{{ formatCurrency(product.sale_price || 0) }}</td>
                  </tr>
                  <tr v-if="filteredProducts.length === 0">
                    <td colspan="7" class="text-center text-muted py-4">No se encontraron productos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showProductModal = false">CERRAR</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Búsqueda de Vendedor -->
    <div v-if="showVendorModal" class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">Busqueda de datos - Vendedores</h5>
            <button type="button" class="btn-close btn-close-white" @click="showVendorModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-12">
                <div class="input-group">
                  <span class="input-group-text"><i class="ti ti-search"></i></span>
                  <input type="text" class="form-control" v-model="vendorSearch" placeholder="Buscar vendedor...">
                </div>
              </div>
            </div>

            <div class="table-responsive" style="max-height: 400px;">
              <table class="table table-hover table-sm">
                <thead class="table-light sticky-top">
                  <tr>
                    <th style="width: 15%;">Código</th>
                    <th style="width: 35%;">Vendedor</th>
                    <th style="width: 35%;">Conductor</th>
                    <th style="width: 15%;">Agencias</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="vendor in filteredVendors" :key="vendor.id" @click="selectVendor(vendor)" style="cursor: pointer;">
                    <td>{{ vendor.code }}</td>
                    <td>{{ vendor.name }}</td>
                    <td>{{ vendor.conductor || 'N/A' }}</td>
                    <td>{{ vendor.agency || 'TODAS' }}</td>
                  </tr>
                  <tr v-if="filteredVendors.length === 0">
                    <td colspan="4" class="text-center text-muted py-4">No se encontraron vendedores</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showVendorModal = false">CERRAR</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Campos Adicionales -->
    <div v-if="showAdditionalFields" class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">Campos Adicionales (Encabezado)</h5>
            <button type="button" class="btn-close btn-close-white" @click="showAdditionalFields = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">No. Correlativo de la Orden de Compra Exenta</label>
              <input type="text" class="form-control" v-model="additionalFields.orden_compra" placeholder="No. Correlativo de la Orden de Compra Exenta">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">No. Correlativo de la Constancia del Reg Exonerado</label>
              <input type="text" class="form-control" v-model="additionalFields.constancia_exonerado" placeholder="No. Correlativo de la Constancia del Reg Exonerado">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">No. Identificativo del Registro SAG</label>
              <input type="text" class="form-control" v-model="additionalFields.registro_sag" placeholder="No. Identificativo del Registro SAG">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAdditionalFields = false">CANCELAR Y LIMPIAR DATOS</button>
            <button type="button" class="btn btn-success" @click="saveAdditionalFields">
              <i class="ti ti-check me-1"></i>GUARDAR
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Opciones Adicionales -->
    <div v-if="showAdditionalOptions" class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">Opciones Adicionales</h5>
            <button type="button" class="btn-close btn-close-white" @click="showAdditionalOptions = false"></button>
          </div>
          <div class="modal-body">
            <div class="d-grid gap-2">
              <button class="btn btn-info btn-lg"><i class="ti ti-cash-register me-2"></i>APERTURA DE CAJA</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-cash me-2"></i>EGRESO DE CAJA</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-coins me-2"></i>RETIRAR EFECTIVO</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-discount-2 me-2"></i>% DSCTO. GLOBAL</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-file-certificate me-2"></i>EXONERACIÓN ISV</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-percentage me-2"></i>% APLICAR RECARGO</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-coin me-2"></i>% APLICAR PROPINA</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-arrows-split me-2"></i>↔ DIVIDIR/ UNIR CUENTAS</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-ticket me-2"></i>🎫 APLICAR CUPON DE DESCUENTO</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-calculator me-2"></i>√ RECALCULAR TASA DE CAMBIO</button>
              <button class="btn btn-info btn-lg"><i class="ti ti-refresh me-2"></i>🔄 ACTUALIZAR PRECIOS</button>
              <button class="btn btn-outline-secondary btn-lg"><i class="ti ti-keyboard me-2"></i>⌨ ATAJOS DE TECLADO</button>
              <button class="btn btn-outline-secondary btn-lg"><i class="ti ti-settings me-2"></i>🔧 CONFIG. DOCUMENTO</button>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAdditionalOptions = false">CERRAR</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="showCustomerModal || showAddCustomerModal || showProductModal || showVendorModal || showAdditionalFields || showAdditionalOptions"
         class="modal-backdrop fade show"
         @click="closeAllModals">
    </div>

  </div>
</template>`;

// Agregar datos adicionales necesarios en el script
const additionalData = `
      newCustomer: {
        code: '',
        razon_social: '',
        nombre_comercial: '',
        beneficiary_type: 'JURIDICA_DOMICILIADA',
        tipo_identificacion: 'CEDULA',
        cedula: '',
        sar: '',
        tipo_cliente: 'NACIONAL',
        tipo_contribuyente: 'CONTRIBUYENTE',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        useConsecutive: true
      },
      additionalFields: {
        orden_compra: '',
        constancia_exonerado: '',
        registro_sag: ''
      },
      customerSearch: '',
      productSearch: '',
      vendorSearch: '',
      customerPage: 1,
      customerSearchBy: 'name',
      customerSortBy: 'name',
      productPage: 1,
      productSearchBy: 'name',
      productSortBy: 'name',
      productTypeFilter: '',
      productStockFilter: '',
      productGroupFilter: '',
      productBrandFilter: '',
      productModelFilter: '',
      showAddCustomerModal: false`;

// Agregar métodos adicionales necesarios
const additionalMethods = `
    selectCustomer(customer) {
      this.customerInfo = {
        id: customer.value,
        code: customer.code,
        name: customer.label,
        rtn: customer.rtn,
        phone: customer.phone
      };
      this.showCustomerModal = false;
    },
    viewCustomerInfo(customer) {
      Swal.fire({
        title: customer.label,
        html: \`<div class="text-start">
          <p><strong>Código:</strong> \${customer.code}</p>
          <p><strong>RTN:</strong> \${customer.rtn || 'N/A'}</p>
          <p><strong>Teléfono:</strong> \${customer.phone || 'N/A'}</p>
        </div>\`,
        icon: 'info'
      });
    },
    closeAddCustomerModal() {
      this.showAddCustomerModal = false;
      this.showCustomerModal = true;
      this.newCustomer = {
        code: '',
        razon_social: '',
        nombre_comercial: '',
        beneficiary_type: 'JURIDICA_DOMICILIADA',
        tipo_identificacion: 'CEDULA',
        cedula: '',
        sar: '',
        tipo_cliente: 'NACIONAL',
        tipo_contribuyente: 'CONTRIBUYENTE',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        useConsecutive: true
      };
    },
    async saveNewCustomer() {
      try {
        const customerData = {
          customer_code: this.newCustomer.code,
          name: this.newCustomer.razon_social,
          commercial_name: this.newCustomer.nombre_comercial,
          beneficiary_type: this.newCustomer.beneficiary_type,
          identification_type: this.newCustomer.tipo_identificacion,
          rtn: this.newCustomer.cedula,
          sar_id: this.newCustomer.sar,
          customer_type: this.newCustomer.tipo_cliente,
          taxpayer_type: this.newCustomer.tipo_contribuyente,
          email: this.newCustomer.email,
          phone: this.newCustomer.phone,
          mobile: this.newCustomer.mobile,
          address: this.newCustomer.address
        };

        const response = await api.post('/customers', customerData);
        Swal.fire('Éxito', 'Cliente creado exitosamente', 'success');
        await this.loadCustomers();
        const newCustomer = this.customers.find(c => c.value === response.data.data.id);
        if (newCustomer) {
          this.selectCustomer(newCustomer);
        }
        this.closeAddCustomerModal();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al guardar cliente', 'error');
      }
    },
    selectProduct(product) {
      this.currentProduct.code = product.sku;
      this.currentProduct.name = product.name;
      this.currentProduct.price = product.sale_price || 0;
      this.currentProduct.product_id = product.id;
      this.currentProduct.quantity = 1;
      this.showProductModal = false;
      this.addProduct();
    },
    selectVendor(vendor) {
      this.currentVendor = vendor;
      this.showVendorModal = false;
    },
    saveAdditionalFields() {
      this.showAdditionalFields = false;
      Swal.fire('Guardado', 'Campos adicionales guardados', 'success');
    },
    closeAllModals() {
      this.showCustomerModal = false;
      this.showAddCustomerModal = false;
      this.showProductModal = false;
      this.showVendorModal = false;
      this.showAdditionalFields = false;
      this.showAdditionalOptions = false;
    },
    formatNumber(value) {
      return new Intl.NumberFormat('es-HN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0);
    }`;

// Agregar computed properties adicionales
const additionalComputed = `
    filteredCustomers() {
      let filtered = [...this.customers];
      if (this.customerSearch) {
        const search = this.customerSearch.toLowerCase();
        filtered = filtered.filter(c => {
          if (this.customerSearchBy === 'name') return c.label.toLowerCase().includes(search);
          if (this.customerSearchBy === 'code') return c.code.toLowerCase().includes(search);
          if (this.customerSearchBy === 'rtn') return (c.rtn || '').toLowerCase().includes(search);
          return false;
        });
      }
      if (this.customerSortBy === 'name') filtered.sort((a, b) => a.label.localeCompare(b.label));
      else if (this.customerSortBy === 'code') filtered.sort((a, b) => a.code.localeCompare(b.code));
      return filtered;
    },
    paginatedCustomers() {
      const start = (this.customerPage - 1) * 10;
      return this.filteredCustomers.slice(start, start + 10);
    },
    filteredProducts() {
      let filtered = [...this.products];
      if (this.productSearch) {
        const search = this.productSearch.toLowerCase();
        filtered = filtered.filter(p => {
          if (this.productSearchBy === 'name') return p.name.toLowerCase().includes(search);
          if (this.productSearchBy === 'code') return (p.sku || '').toLowerCase().includes(search);
          return false;
        });
      }
      if (this.productStockFilter === 'in_stock') filtered = filtered.filter(p => p.stock > 0);
      else if (this.productStockFilter === 'out_of_stock') filtered = filtered.filter(p => p.stock <= 0);
      if (this.productGroupFilter) filtered = filtered.filter(p => p.category_name === this.productGroupFilter);
      if (this.productBrandFilter) filtered = filtered.filter(p => p.brand_name === this.productBrandFilter);
      if (this.productModelFilter) filtered = filtered.filter(p => p.model === this.productModelFilter);
      if (this.productSortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
      else if (this.productSortBy === 'code') filtered.sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
      return filtered;
    },
    paginatedProducts() {
      const start = (this.productPage - 1) * 10;
      return this.filteredProducts.slice(start, start + 10);
    },
    productGroups() {
      const groups = new Set();
      this.products.forEach(p => { if (p.category_name) groups.add(p.category_name); });
      return Array.from(groups).sort();
    },
    productBrands() {
      const brands = new Set();
      this.products.forEach(p => { if (p.brand_name) brands.add(p.brand_name); });
      return Array.from(brands).sort();
    },
    productModels() {
      const models = new Set();
      this.products.forEach(p => { if (p.model) models.add(p.model); });
      return Array.from(models).sort();
    },
    filteredVendors() {
      if (!this.vendorSearch) return this.vendors;
      const search = this.vendorSearch.toLowerCase();
      return this.vendors.filter(v => v.name.toLowerCase().includes(search) || v.code.toLowerCase().includes(search));
    }`;

// Agregar CSS adicional
const additionalCSS = `
.modal.show {
  display: block !important;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  opacity: 0.5;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.product-img-mini {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}`;

try {
  // Reemplazar el comentario de modales con el HTML completo
  content = content.replace('<!-- Modals will be added here -->', '');
  content = content.replace('<!-- Customer Modal, Product Modal, Vendor Modal, etc. -->', modalsHTML);

  // Agregar datos adicionales en data()
  content = content.replace('showAdditionalOptions: false', `showAdditionalOptions: false,${additionalData}`);

  // Agregar métodos adicionales
  content = content.replace('formatCurrency(value) {', additionalMethods + '\n    formatCurrency(value) {');

  // Agregar computed properties
  content = content.replace('totals() {', additionalComputed + ',\n    totals() {');

  // Agregar CSS adicional
  content = content.replace('</style>', additionalCSS + '\n</style>');

  // Guardar el archivo actualizado
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('✓ Modales agregados exitosamente al archivo pos-invoice.vue');
} catch (error) {
  console.error('✗ Error al agregar modales:', error.message);
  process.exit(1);
}
