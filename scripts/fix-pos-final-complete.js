const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

console.log('🔧 Aplicando correcciones finales al POS...\n');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  // ==================== FIX 1: Corregir loadVendors para obtener datos correctamente ====================
  console.log('✓ Fix 1: Corrigiendo loadVendors para obtener solo vendedores');

  const oldLoadVendors = /async loadVendors\(\) \{[\s\S]*?catch \(error\) \{[\s\S]*?this\.vendors = \[\];[\s\S]*?\}[\s\S]*?\},/;

  const newLoadVendors = `async loadVendors() {
      try {
        // Obtener solo usuarios con rol de Vendedor (role_id = 4)
        const response = await api.get('/users', {
          params: {
            limit: 10000,
            role: 4  // ID del rol Vendedor
          }
        });

        console.log('Users/Vendors response:', response.data);

        // Manejar diferentes estructuras de respuesta
        let users = [];

        if (response.data.data && Array.isArray(response.data.data)) {
          users = response.data.data;
        } else if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          users = response.data.users;
        }

        console.log('Users array:', users);

        if (Array.isArray(users) && users.length > 0) {
          this.vendors = users.map(u => ({
            id: u.id,
            code: (u.id || '').toString(),
            name: u.first_name && u.last_name
              ? \`\${u.first_name} \${u.last_name}\`
              : u.name || u.username || 'Sin nombre',
            agency: 'AGENCIA PRINCIPAL'
          }));
          console.log('Vendors loaded:', this.vendors.length);
        } else {
          // Si no hay vendedores específicos, cargar todos los usuarios
          const allUsersResponse = await api.get('/users', {
            params: { limit: 10000 }
          });

          const allUsers = allUsersResponse.data?.data || allUsersResponse.data || [];

          if (Array.isArray(allUsers)) {
            this.vendors = allUsers.map(u => ({
              id: u.id,
              code: (u.id || '').toString(),
              name: u.first_name && u.last_name
                ? \`\${u.first_name} \${u.last_name}\`
                : u.name || u.username || 'Sin nombre',
              agency: 'AGENCIA PRINCIPAL'
            }));
            console.log('Vendors loaded (all users):', this.vendors.length);
          }
        }
      } catch (error) {
        console.error('Error loading vendors:', error);
        this.vendors = [];
      }
    },`;

  content = content.replace(oldLoadVendors, newLoadVendors);

  // ==================== FIX 2: Corregir loadProducts para obtener datos correctamente ====================
  console.log('✓ Fix 2: Corrigiendo loadProducts para obtener estructura correcta');

  const oldLoadProducts = /async loadProducts\(\) \{[\s\S]*?catch \(error\) \{[\s\S]*?this\.products = \[\];[\s\S]*?\}[\s\S]*?\},/;

  const newLoadProducts = `async loadProducts() {
      try {
        const response = await api.get('/products', {
          params: { limit: 10000 }
        });

        console.log('Products response:', response.data);

        // Manejar diferentes estructuras de respuesta
        let productsData = [];

        if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data.products && Array.isArray(response.data.products)) {
          productsData = response.data.products;
        }

        console.log('Products array:', productsData);

        if (Array.isArray(productsData) && productsData.length > 0) {
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
          console.log('Products loaded:', this.products.length);
        } else {
          console.warn('No products found in response');
          this.products = [];
        }
      } catch (error) {
        console.error('Error loading products:', error);
        this.products = [];
      }
    },`;

  content = content.replace(oldLoadProducts, newLoadProducts);

  // ==================== FIX 3: Agregar paginación a clientes ====================
  console.log('✓ Fix 3: Agregando paginación de clientes (10 por página)');

  // Agregar propiedad customerPerPage en data
  const oldCustomerPage = `      customerPage: 1,`;
  const newCustomerPage = `      customerPage: 1,
      customerPerPage: 10,`;

  content = content.replace(oldCustomerPage, newCustomerPage);

  // Actualizar paginatedCustomers
  const oldPaginatedCustomers = `    paginatedCustomers() {
      const start = (this.customerPage - 1) * 10;
      return this.filteredCustomers.slice(start, start + 10);
    },`;

  const newPaginatedCustomers = `    paginatedCustomers() {
      const start = (this.customerPage - 1) * this.customerPerPage;
      return this.filteredCustomers.slice(start, start + this.customerPerPage);
    },
    customerTotalPages() {
      return Math.ceil(this.filteredCustomers.length / this.customerPerPage);
    },`;

  content = content.replace(oldPaginatedCustomers, newPaginatedCustomers);

  // ==================== FIX 4: Agregar paginación a productos ====================
  console.log('✓ Fix 4: Agregando paginación de productos (10 por página)');

  // Agregar propiedad productPerPage en data
  const oldProductPage = `      productPage: 1,`;
  const newProductPage = `      productPage: 1,
      productPerPage: 10,`;

  content = content.replace(oldProductPage, newProductPage);

  // Actualizar paginatedProducts
  const oldPaginatedProducts = `    paginatedProducts() {
      const start = (this.productPage - 1) * 10;
      return this.filteredProducts.slice(start, start + 10);
    },`;

  const newPaginatedProducts = `    paginatedProducts() {
      const start = (this.productPage - 1) * this.productPerPage;
      return this.filteredProducts.slice(start, start + this.productPerPage);
    },
    productTotalPages() {
      return Math.ceil(this.filteredProducts.length / this.productPerPage);
    },`;

  content = content.replace(oldPaginatedProducts, newPaginatedProducts);

  // ==================== FIX 5: Mejorar modal de info de cliente ====================
  console.log('✓ Fix 5: Mejorando modal de info de cliente');

  const oldViewCustomerInfo = `    viewCustomerInfo(customer) {
      Swal.fire({
        title: customer.label,
        html: \`<div class="text-start">
          <p><strong>Código:</strong> \${customer.code}</p>
          <p><strong>RTN:</strong> \${customer.rtn || 'N/A'}</p>
          <p><strong>Teléfono:</strong> \${customer.phone || 'N/A'}</p>
        </div>\`,
        icon: 'info'
      });
    },`;

  const newViewCustomerInfo = `    viewCustomerInfo(customer) {
      Swal.fire({
        title: customer.label,
        html: \`<div class="text-start">
          <p><strong>Código:</strong> \${customer.code || 'N/A'}</p>
          <p><strong>Nombre:</strong> \${customer.label || 'N/A'}</p>
          <p><strong>Documento:</strong> \${customer.rtn || 'N/A'}</p>
          <p><strong>Teléfono:</strong> \${customer.phone || 'N/A'}</p>
          <p><strong>Actividad económica:</strong> N/A</p>
          <p><strong>Tipo Contribuyente:</strong> CONTRIBUYENTE</p>
        </div>\`,
        icon: 'info',
        width: 500
      });
    },`;

  content = content.replace(oldViewCustomerInfo, newViewCustomerInfo);

  // ==================== FIX 6: Agregar controles de paginación en los modales ====================
  console.log('✓ Fix 6: Agregando controles de paginación en modales');

  // Paginación de clientes
  const oldCustomerModalFooter = `          <div class="modal-footer">
            <button type="button" class="btn btn-success" @click="showAddCustomerModal = true; showCustomerModal = false;">
              <i class="ti ti-plus me-1"></i>Nuevo Cliente
            </button>
            <button type="button" class="btn btn-secondary" @click="showCustomerModal = false">Cerrar</button>
          </div>`;

  const newCustomerModalFooter = `          <div class="modal-footer justify-content-between">
            <div>
              <button type="button" class="btn btn-success" @click="showAddCustomerModal = true; showCustomerModal = false;">
                <i class="ti ti-plus me-1"></i>Nuevo Cliente
              </button>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                @click="customerPage--"
                :disabled="customerPage <= 1">
                <i class="ti ti-chevron-left"></i>
              </button>
              <span class="small">Página {{ customerPage }} de {{ customerTotalPages }}</span>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                @click="customerPage++"
                :disabled="customerPage >= customerTotalPages">
                <i class="ti ti-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-secondary" @click="showCustomerModal = false">Cerrar</button>
            </div>
          </div>`;

  content = content.replace(oldCustomerModalFooter, newCustomerModalFooter);

  // Paginación de productos
  const oldProductModalFooter = `          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showProductModal = false">CERRAR</button>
          </div>`;

  const newProductModalFooter = `          <div class="modal-footer justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                @click="productPage--"
                :disabled="productPage <= 1">
                <i class="ti ti-chevron-left"></i>
              </button>
              <span class="small">Página {{ productPage }} de {{ productTotalPages }}</span>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                @click="productPage++"
                :disabled="productPage >= productTotalPages">
                <i class="ti ti-chevron-right"></i>
              </button>
            </div>
            <button type="button" class="btn btn-secondary" @click="showProductModal = false">CERRAR</button>
          </div>`;

  content = content.replace(oldProductModalFooter, newProductModalFooter);

  // Guardar archivo
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('\n✅ CORRECCIONES FINALES APLICADAS\n');
  console.log('Resumen de cambios:');
  console.log('  ✓ Vendedores: carga usuarios con role_id = 4 (Vendedor)');
  console.log('  ✓ Productos: maneja múltiples estructuras de respuesta');
  console.log('  ✓ Clientes: paginación de 10 por página con controles');
  console.log('  ✓ Productos: paginación de 10 por página con controles');
  console.log('  ✓ Info de cliente: modal mejorado con más datos');
  console.log('  ✓ Controles de navegación en modales');
  console.log('\n🔄 Recarga la página del navegador');

} catch (error) {
  console.error('✗ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
