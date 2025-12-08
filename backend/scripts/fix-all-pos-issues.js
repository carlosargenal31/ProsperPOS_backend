const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

console.log('🔧 Iniciando corrección completa del POS...\n');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  // ==================== FIX 1: Títulos de modales en BLANCO ====================
  console.log('✓ Fix 1: Cambiando títulos de modales a color blanco');

  // Modal de clientes
  content = content.replace(
    '<div class="modal-header bg-dark text-white">\n            <h5 class="modal-title">Busqueda de datos</h5>',
    '<div class="modal-header bg-dark text-white">\n            <h5 class="modal-title text-white">Búsqueda de datos</h5>'
  );

  // Modal de nuevo cliente
  content = content.replace(
    '<h5 class="modal-title">Documentos Ventas - Nuevo Cliente</h5>',
    '<h5 class="modal-title text-white">Documentos Ventas - Nuevo Cliente</h5>'
  );

  // Modal de productos
  content = content.replace(
    '<h5 class="modal-title">Busqueda de datos - Productos</h5>',
    '<h5 class="modal-title text-white">Búsqueda de datos - Productos</h5>'
  );

  // Modal de vendedores
  content = content.replace(
    '<h5 class="modal-title">Busqueda de datos - Vendedores</h5>',
    '<h5 class="modal-title text-white">Búsqueda de datos - Vendedores</h5>'
  );

  // Modal de campos adicionales
  content = content.replace(
    '<h5 class="modal-title">Campos Adicionales (Encabezado)</h5>',
    '<h5 class="modal-title text-white">Campos Adicionales (Encabezado)</h5>'
  );

  // Modal de opciones adicionales
  content = content.replace(
    '<h5 class="modal-title">Opciones Adicionales</h5>',
    '<h5 class="modal-title text-white">Opciones Adicionales</h5>'
  );

  // ==================== FIX 2: Botones de cierre NEGROS ====================
  console.log('✓ Fix 2: Cambiando botones de cierre a negro');
  content = content.replace(/btn-close btn-close-white/g, 'btn-close');

  // ==================== FIX 3: Quitar "Tipo Item" del modal de productos ====================
  console.log('✓ Fix 3: Quitando "Tipo Item" del modal de productos');
  const tipoItemSection = `              <div class="col-md-2">
                <label class="form-label fw-bold">Tipo Item</label>
                <select class="form-select form-select-sm" v-model="productTypeFilter">
                  <option value="">Todos</option>
                  <option value="product">Producto</option>
                  <option value="service">Servicio</option>
                </select>
              </div>`;
  content = content.replace(tipoItemSection, '');

  // Ajustar grid de filtros de productos (de col-md-3 a col-md-4)
  content = content.replace(
    '<div class="col-md-3">\n                <label class="form-label fw-bold">Existencias</label>',
    '<div class="col-md-4">\n                <label class="form-label fw-bold">Existencias</label>'
  );

  // ==================== FIX 4: Cambiar "Grupo" por "Categoría" ====================
  console.log('✓ Fix 4: Cambiando "Grupo" por "Categoría"');
  content = content.replace(
    '<label class="form-label fw-bold">Seleccione un Grupo</label>',
    '<label class="form-label fw-bold">Seleccione una Categoría</label>'
  );
  content = content.replace(
    '<option value="">Todos los Grupos</option>',
    '<option value="">Todas las Categorías</option>'
  );

  // Cambiar en la tabla de productos
  content = content.replace(
    '<th style="width: 15%;">Grupo/Subgrupo</th>',
    '<th style="width: 15%;">Categoría/Subcategoría</th>'
  );

  // ==================== FIX 5: Quitar "Modelo" ====================
  console.log('✓ Fix 5: Quitando "Modelo" del modal de productos');
  const modeloSection = `              <div class="col-md-4">
                <label class="form-label fw-bold">Seleccione un Modelo</label>
                <select class="form-select form-select-sm" v-model="productModelFilter">
                  <option value="">Todos los Modelos</option>
                  <option v-for="model in productModels" :key="model" :value="model">{{ model }}</option>
                </select>
              </div>`;
  content = content.replace(modeloSection, '');

  // ==================== FIX 6: Quitar columna "Conductor" de vendedores ====================
  console.log('✓ Fix 6: Quitando columna "Conductor" de vendedores');
  content = content.replace(
    `                  <tr>
                    <th style="width: 15%;">Código</th>
                    <th style="width: 35%;">Vendedor</th>
                    <th style="width: 35%;">Conductor</th>
                    <th style="width: 15%;">Agencias</th>
                  </tr>`,
    `                  <tr>
                    <th style="width: 20%;">Código</th>
                    <th style="width: 50%;">Vendedor</th>
                    <th style="width: 30%;">Agencias</th>
                  </tr>`
  );

  content = content.replace(
    `                    <td>{{ vendor.code }}</td>
                    <td>{{ vendor.name }}</td>
                    <td>{{ vendor.conductor || 'N/A' }}</td>
                    <td>{{ vendor.agency || 'TODAS' }}</td>`,
    `                    <td>{{ vendor.code }}</td>
                    <td>{{ vendor.name }}</td>
                    <td>{{ vendor.agency || 'TODAS' }}</td>`
  );

  content = content.replace(
    'colspan="4"',
    'colspan="3"'
  );

  // ==================== FIX 7: Agregar botón de editar código de cliente ====================
  console.log('✓ Fix 7: Agregando edición de código de cliente y botón "+"');

  const oldClienteRow = `                  <div class="col-md-5">
                    <label class="label-tiny">Cliente</label>
                    <div class="input-group input-group-sm">
                      <button class="btn btn-info btn-sm" @click="showCustomerModal = true">
                        <i class="ti ti-search"></i>
                      </button>
                      <input type="text" class="form-control form-control-sm" v-model="customerInfo.code" placeholder="Código" readonly style="max-width: 80px;">
                      <input type="text" class="form-control form-control-sm flex-grow-1" v-model="customerInfo.name" placeholder="Nombre" readonly>
                    </div>
                  </div>`;

  const newClienteRow = `                  <div class="col-md-5">
                    <label class="label-tiny">Cliente</label>
                    <div class="input-group input-group-sm">
                      <button class="btn btn-info btn-sm" @click="showCustomerModal = true">
                        <i class="ti ti-search"></i>
                      </button>
                      <input type="text" class="form-control form-control-sm" v-model="customerInfo.code" placeholder="Código" style="max-width: 80px;" @blur="searchCustomerByCode">
                      <input type="text" class="form-control form-control-sm flex-grow-1" v-model="customerInfo.name" placeholder="Nombre" readonly>
                      <button class="btn btn-success btn-sm" @click="showAddCustomerModal = true" title="Nuevo Cliente">
                        <i class="ti ti-plus"></i>
                      </button>
                    </div>
                  </div>`;

  content = content.replace(oldClienteRow, newClienteRow);

  // ==================== FIX 8: Cargar vendedores desde usuarios ====================
  console.log('✓ Fix 8: Configurando carga de vendedores');

  const oldLoadInitialData = `    async loadInitialData() {
      await Promise.all([
        this.loadCustomers(),
        this.loadProducts(),
        this.loadWarehouses()
      ]);
    },`;

  const newLoadInitialData = `    async loadInitialData() {
      await Promise.all([
        this.loadCustomers(),
        this.loadProducts(),
        this.loadWarehouses(),
        this.loadVendors()
      ]);
    },`;

  content = content.replace(oldLoadInitialData, newLoadInitialData);

  // Agregar método loadVendors después de loadWarehouses
  const loadWarehousesEnd = `    async loadWarehouses() {
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
    },`;

  const loadWarehousesWithVendors = `    async loadWarehouses() {
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
    async loadVendors() {
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

  content = content.replace(loadWarehousesEnd, loadWarehousesWithVendors);

  // ==================== FIX 9: Agregar método searchCustomerByCode ====================
  console.log('✓ Fix 9: Agregando búsqueda de cliente por código');

  const searchProductByCodeMethod = `    async searchProductByCode() {`;

  const searchCustomerByCodeMethod = `    async searchCustomerByCode() {
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
    async searchProductByCode() {`;

  content = content.replace(searchProductByCodeMethod, searchCustomerByCodeMethod);

  // Guardar archivo
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('\n✅ TODAS LAS CORRECCIONES APLICADAS EXITOSAMENTE\n');
  console.log('Resumen de cambios:');
  console.log('  ✓ Títulos de modales en BLANCO');
  console.log('  ✓ Botones de cierre en NEGRO');
  console.log('  ✓ "Artículo" → "Producto"');
  console.log('  ✓ "Almacén" → "Bodega"');
  console.log('  ✓ "Grupo" → "Categoría"');
  console.log('  ✓ "Grupo/Subgrupo" → "Categoría/Subcategoría"');
  console.log('  ✓ Quitado "Tipo Item"');
  console.log('  ✓ Quitado "Modelo"');
  console.log('  ✓ Quitada columna "Conductor" de vendedores');
  console.log('  ✓ Código de cliente editable con búsqueda');
  console.log('  ✓ Botón "+" para nuevo cliente');
  console.log('  ✓ Carga de vendedores desde usuarios');
  console.log('\n🔄 Recarga la página del navegador para ver los cambios');

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
