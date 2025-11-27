const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

console.log('🔧 Corrigiendo carga de datos del POS...\n');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  // ==================== FIX 1: Corregir loadCustomers ====================
  console.log('✓ Fix 1: Corrigiendo loadCustomers');

  const oldLoadCustomers = `    async loadCustomers() {
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
    },`;

  const newLoadCustomers = `    async loadCustomers() {
      try {
        const response = await api.get('/customers', {
          params: { limit: 10000 }
        });

        console.log('Customers response:', response.data);

        const customersData = response.data?.data || response.data || [];

        if (Array.isArray(customersData)) {
          this.customers = customersData.map(c => ({
            label: c.name || c.customer_name || 'Sin nombre',
            value: c.id,
            code: c.customer_code || c.code || '',
            rtn: c.rtn || '',
            phone: c.phone || c.phone_number || ''
          }));
          console.log('Customers loaded:', this.customers.length);
        } else {
          console.warn('Customers data is not an array:', customersData);
          this.customers = [];
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        this.customers = [];
      }
    },`;

  content = content.replace(oldLoadCustomers, newLoadCustomers);

  // ==================== FIX 2: Corregir loadProducts ====================
  console.log('✓ Fix 2: Corrigiendo loadProducts');

  const oldLoadProducts = `    async loadProducts() {
      try {
        const response = await api.get('/products');
        this.products = response.data.data || [];
      } catch (error) {
        console.error('Error loading products:', error);
      }
    },`;

  const newLoadProducts = `    async loadProducts() {
      try {
        const response = await api.get('/products', {
          params: { limit: 10000 }
        });

        console.log('Products response:', response.data);

        const productsData = response.data?.data || response.data || [];

        if (Array.isArray(productsData)) {
          this.products = productsData;
          console.log('Products loaded:', this.products.length);
        } else {
          console.warn('Products data is not an array:', productsData);
          this.products = [];
        }
      } catch (error) {
        console.error('Error loading products:', error);
        this.products = [];
      }
    },`;

  content = content.replace(oldLoadProducts, newLoadProducts);

  // ==================== FIX 3: Corregir loadWarehouses ====================
  console.log('✓ Fix 3: Corrigiendo loadWarehouses');

  const oldLoadWarehouses = `    async loadWarehouses() {
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

  const newLoadWarehouses = `    async loadWarehouses() {
      try {
        const response = await api.get('/warehouses', {
          params: { limit: 10000 }
        });

        console.log('Warehouses response:', response.data);

        const warehousesData = response.data?.data || response.data || [];

        if (Array.isArray(warehousesData)) {
          this.warehouses = warehousesData.map(w => ({
            label: w.name || w.warehouse_name || 'Sin nombre',
            value: w.id
          }));
          console.log('Warehouses loaded:', this.warehouses.length);

          if (this.warehouses.length > 0) {
            this.invoice.warehouse_id = this.warehouses[0].value;
          }
        } else {
          console.warn('Warehouses data is not an array:', warehousesData);
          this.warehouses = [];
        }
      } catch (error) {
        console.error('Error loading warehouses:', error);
        this.warehouses = [];
      }
    },`;

  content = content.replace(oldLoadWarehouses, newLoadWarehouses);

  // ==================== FIX 4: Ya tenemos el loadVendors corregido, solo agregamos más logs ====================
  console.log('✓ Fix 4: Mejorando loadVendors con más logs');

  const oldLoadVendors = `    async loadVendors() {
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

  const newLoadVendors = `    async loadVendors() {
      try {
        const response = await api.get('/users', {
          params: { limit: 10000 }
        });

        console.log('Users/Vendors response:', response.data);

        const users = response.data?.data || response.data || [];

        if (Array.isArray(users)) {
          this.vendors = users.map(u => ({
            id: u.id,
            code: u.id ? u.id.toString() : '',
            name: u.name || u.username || 'Sin nombre',
            agency: 'AGENCIA PRINCIPAL'
          }));
          console.log('Vendors loaded:', this.vendors.length);
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

  // Guardar archivo
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('\n✅ CARGA DE DATOS CORREGIDA\n');
  console.log('Resumen de cambios:');
  console.log('  ✓ loadCustomers corregido con validaciones y logs');
  console.log('  ✓ loadProducts corregido con validaciones y logs');
  console.log('  ✓ loadWarehouses corregido con validaciones y logs');
  console.log('  ✓ loadVendors mejorado con más logs');
  console.log('  ✓ Agregado limit: 10000 a todas las peticiones');
  console.log('  ✓ Manejo de diferentes estructuras de respuesta');
  console.log('\n🔄 Recarga la página y abre la consola del navegador para ver los logs');

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
