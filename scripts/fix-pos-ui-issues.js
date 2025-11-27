const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

console.log('🔧 Corrigiendo issues de UI del POS...\n');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  // ==================== FIX 1: Quitar lupa de bodega ====================
  console.log('✓ Fix 1: Quitando lupa de bodega');

  const oldWarehouseInput = `                  <div class="col-md-3">
                    <label class="label-tiny">Bodega</label>
                    <div class="input-group input-group-sm">
                      <button class="btn btn-info btn-sm" @click="focusWarehouse">
                        <i class="ti ti-search"></i>
                      </button>
                      <select class="form-select form-select-sm" v-model="invoice.warehouse_id" ref="warehouseSelect">
                        <option v-for="w in warehouses" :key="w.value" :value="w.value">{{ w.label }}</option>
                      </select>
                    </div>
                  </div>`;

  const newWarehouseInput = `                  <div class="col-md-3">
                    <label class="label-tiny">Bodega</label>
                    <select class="form-select form-select-sm" v-model="invoice.warehouse_id" ref="warehouseSelect">
                      <option v-for="w in warehouses" :key="w.value" :value="w.value">{{ w.label }}</option>
                    </select>
                  </div>`;

  content = content.replace(oldWarehouseInput, newWarehouseInput);

  // ==================== FIX 2: Quitar columna Agencias de vendedores ====================
  console.log('✓ Fix 2: Quitando columna Agencias de vendedores');

  const oldVendorTable = `                  <tr>
                    <th style="width: 20%;">Código</th>
                    <th style="width: 50%;">Vendedor</th>
                    <th style="width: 30%;">Agencias</th>
                  </tr>`;

  const newVendorTable = `                  <tr>
                    <th style="width: 30%;">Código</th>
                    <th style="width: 70%;">Vendedor</th>
                  </tr>`;

  content = content.replace(oldVendorTable, newVendorTable);

  const oldVendorRow = `                  <tr v-for="vendor in filteredVendors" :key="vendor.id" @click="selectVendor(vendor)" style="cursor: pointer;">
                    <td>{{ vendor.code }}</td>
                    <td>{{ vendor.name }}</td>
                    <td>{{ vendor.agency || 'TODAS' }}</td>
                  </tr>`;

  const newVendorRow = `                  <tr v-for="vendor in filteredVendors" :key="vendor.id" @click="selectVendor(vendor)" style="cursor: pointer;">
                    <td>{{ vendor.code }}</td>
                    <td>{{ vendor.name }}</td>
                  </tr>`;

  content = content.replace(oldVendorRow, newVendorRow);

  const oldVendorNoResults = `                  <tr v-if="filteredVendors.length === 0">
                    <td colspan="4" class="text-center text-muted py-4">No se encontraron vendedores</td>
                  </tr>`;

  const newVendorNoResults = `                  <tr v-if="filteredVendors.length === 0">
                    <td colspan="2" class="text-center text-muted py-4">No se encontraron vendedores</td>
                  </tr>`;

  content = content.replace(oldVendorNoResults, newVendorNoResults);

  // ==================== FIX 3: Cambiar viewCustomerInfo para que sea un modal interno ====================
  console.log('✓ Fix 3: Cambiando info de cliente a modal interno');

  // Primero, agregar estado para el modal de info
  const oldShowAddCustomerModal = `      showAddCustomerModal: false,`;
  const newShowAddCustomerModal = `      showAddCustomerModal: false,
      showCustomerInfoModal: false,
      selectedCustomerInfo: null,`;

  content = content.replace(oldShowAddCustomerModal, newShowAddCustomerModal);

  // Cambiar el método viewCustomerInfo
  const oldViewCustomerInfo = /viewCustomerInfo\(customer\) \{[\s\S]*?\},/;

  const newViewCustomerInfo = `viewCustomerInfo(customer) {
      this.selectedCustomerInfo = customer;
      this.showCustomerInfoModal = true;
    },`;

  content = content.replace(oldViewCustomerInfo, newViewCustomerInfo);

  // Agregar el modal de info después del modal de clientes
  const customerModalEnd = `    </div>

    <!-- Modal: Nuevo Cliente -->`;

  const customerInfoModal = `    </div>

    <!-- Modal: Info de Cliente -->
    <div v-if="showCustomerInfoModal" class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title text-white">Información del Cliente</h5>
            <button type="button" class="btn-close" @click="showCustomerInfoModal = false"></button>
          </div>
          <div class="modal-body" v-if="selectedCustomerInfo">
            <div class="row g-3">
              <div class="col-12">
                <p class="mb-2"><strong>Nombre:</strong> {{ selectedCustomerInfo.label }}</p>
              </div>
              <div class="col-12">
                <p class="mb-2"><strong>Código:</strong> {{ selectedCustomerInfo.code || 'N/A' }}</p>
              </div>
              <div class="col-12">
                <p class="mb-2"><strong>Documento:</strong> {{ selectedCustomerInfo.rtn || 'N/A' }}</p>
              </div>
              <div class="col-12">
                <p class="mb-2"><strong>Teléfono:</strong> {{ selectedCustomerInfo.phone || 'N/A' }}</p>
              </div>
              <div class="col-12">
                <p class="mb-2"><strong>Actividad económica:</strong> N/A</p>
              </div>
              <div class="col-12">
                <p class="mb-0"><strong>Tipo Contribuyente:</strong> CONTRIBUYENTE</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCustomerInfoModal = false">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Nuevo Cliente -->`;

  content = content.replace(customerModalEnd, customerInfoModal);

  // Actualizar el backdrop para incluir el nuevo modal
  const oldBackdrop = `    <div v-if="showCustomerModal || showAddCustomerModal || showProductModal || showVendorModal || showAdditionalFields || showAdditionalOptions"
         class="modal-backdrop fade show"
         @click="closeAllModals">
    </div>`;

  const newBackdrop = `    <div v-if="showCustomerModal || showAddCustomerModal || showCustomerInfoModal || showProductModal || showVendorModal || showAdditionalFields || showAdditionalOptions"
         class="modal-backdrop fade show"
         @click="closeAllModals">
    </div>`;

  content = content.replace(oldBackdrop, newBackdrop);

  // Actualizar closeAllModals
  const oldCloseAllModals = `    closeAllModals() {
      this.showCustomerModal = false;
      this.showAddCustomerModal = false;
      this.showProductModal = false;
      this.showVendorModal = false;
      this.showAdditionalFields = false;
      this.showAdditionalOptions = false;
    },`;

  const newCloseAllModals = `    closeAllModals() {
      this.showCustomerModal = false;
      this.showAddCustomerModal = false;
      this.showCustomerInfoModal = false;
      this.showProductModal = false;
      this.showVendorModal = false;
      this.showAdditionalFields = false;
      this.showAdditionalOptions = false;
    },`;

  content = content.replace(oldCloseAllModals, newCloseAllModals);

  // ==================== FIX 4: Corregir loadVendors para manejar la estructura correcta ====================
  console.log('✓ Fix 4: Corrigiendo procesamiento de respuesta de vendedores');

  // Buscar y reemplazar el método loadVendors actual
  const vendorsMethodStart = content.indexOf('async loadVendors() {');
  const vendorsMethodEnd = content.indexOf('    },\n    // ==================== MÉTODOS DE PAGO');

  if (vendorsMethodStart !== -1 && vendorsMethodEnd !== -1) {
    const beforeMethod = content.substring(0, vendorsMethodStart);
    const afterMethod = content.substring(vendorsMethodEnd);

    const newLoadVendorsComplete = `async loadVendors() {
      try {
        // Obtener solo usuarios con rol de Vendedor (role_id = 4)
        const response = await api.get('/users', {
          params: {
            limit: 10000,
            role: 4  // ID del rol Vendedor
          }
        });

        console.log('Vendors full response:', response);
        console.log('Vendors response.data:', response.data);

        // La respuesta viene con estructura: { success: true, data: [...], pagination: {...} }
        let usersData = [];

        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          usersData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          usersData = response.data;
        }

        console.log('Users data extracted:', usersData);

        if (usersData.length > 0) {
          this.vendors = usersData.map(u => ({
            id: u.id,
            code: (u.id || '').toString(),
            name: u.first_name && u.last_name
              ? \`\${u.first_name} \${u.last_name}\`
              : u.name || u.username || 'Sin nombre'
          }));
          console.log('Vendors loaded successfully:', this.vendors.length, this.vendors);
        } else {
          console.warn('No vendors found, loading all users as fallback');
          // Fallback: cargar todos los usuarios
          const allResponse = await api.get('/users', {
            params: { limit: 10000 }
          });

          const allUsers = allResponse.data?.data || allResponse.data || [];

          this.vendors = allUsers.map(u => ({
            id: u.id,
            code: (u.id || '').toString(),
            name: u.first_name && u.last_name
              ? \`\${u.first_name} \${u.last_name}\`
              : u.name || u.username || 'Sin nombre'
          }));
          console.log('All users loaded as vendors:', this.vendors.length);
        }
      } catch (error) {
        console.error('Error loading vendors:', error);
        this.vendors = [];
      }
    }`;

    content = beforeMethod + newLoadVendorsComplete + afterMethod;
  }

  // ==================== FIX 5: Corregir loadProducts de la misma manera ====================
  console.log('✓ Fix 5: Corrigiendo procesamiento de respuesta de productos');

  const productsMethodStart = content.indexOf('async loadProducts() {');
  const productsMethodEnd = content.indexOf('    },\n    async loadWarehouses()');

  if (productsMethodStart !== -1 && productsMethodEnd !== -1) {
    const beforeMethod = content.substring(0, productsMethodStart);
    const afterMethod = content.substring(productsMethodEnd);

    const newLoadProductsComplete = `async loadProducts() {
      try {
        const response = await api.get('/products', {
          params: { limit: 10000 }
        });

        console.log('Products full response:', response);
        console.log('Products response.data:', response.data);

        // La respuesta viene con estructura: { success: true, data: [...], pagination: {...} }
        let productsData = [];

        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          productsData = response.data;
        }

        console.log('Products data extracted:', productsData.length, 'products');

        if (productsData.length > 0) {
          // Mapear productos con los nombres correctos de la BD
          this.products = productsData.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.code || p.sku,
            barcode: p.barcode,
            sale_price: p.price_1 || p.sale_price || 0,
            cost: p.cost || 0,
            stock: p.stock || 0,
            category_id: p.category_id,
            category_name: p.category_name || '',
            subcategory_id: p.subcategory_id,
            subcategory_name: p.subcategory_name || '',
            brand_id: p.brand_id,
            brand_name: p.brand_name || '',
            tax_rate: p.tax_rate || 0,
            unit: p.unit || 'Unidad',
            image: p.image
          }));
          console.log('Products loaded successfully:', this.products.length);
        } else {
          console.warn('No products found in response');
          this.products = [];
        }
      } catch (error) {
        console.error('Error loading products:', error);
        this.products = [];
      }
    }`;

    content = beforeMethod + newLoadProductsComplete + afterMethod;
  }

  // Guardar archivo
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('\n✅ ISSUES DE UI CORREGIDOS\n');
  console.log('Resumen de cambios:');
  console.log('  ✓ Lupa de bodega eliminada');
  console.log('  ✓ Columna "Agencias" eliminada de vendedores');
  console.log('  ✓ Info de cliente ahora es modal interno');
  console.log('  ✓ Procesamiento de vendedores mejorado');
  console.log('  ✓ Procesamiento de productos mejorado');
  console.log('\n🔄 Recarga la página y revisa la consola del navegador');

} catch (error) {
  console.error('✗ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
