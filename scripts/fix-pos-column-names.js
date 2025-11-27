const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

console.log('🔧 Corrigiendo nombres de columnas del POS...\n');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  // ==================== FIX 1: Corregir loadCustomers con nombres de columnas correctos ====================
  console.log('✓ Fix 1: Corrigiendo loadCustomers con nombres reales de BD');

  const oldLoadCustomers = `    async loadCustomers() {
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

  const newLoadCustomers = `    async loadCustomers() {
      try {
        const response = await api.get('/customers', {
          params: { limit: 10000 }
        });

        console.log('Customers response:', response.data);

        const customersData = response.data?.data || response.data || [];

        if (Array.isArray(customersData)) {
          this.customers = customersData.map(c => ({
            label: c.nombre || c.name || 'Sin nombre',
            value: c.id,
            code: c.codigo || c.customer_code || c.code || '',
            rtn: c.doc_identificacion || c.rtn || '',
            phone: c.telefono || c.phone || ''
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

  // ==================== FIX 2: Corregir loadProducts con nombres correctos ====================
  console.log('✓ Fix 2: Corrigiendo loadProducts con nombres reales de BD');

  const oldLoadProducts = `    async loadProducts() {
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

  const newLoadProducts = `    async loadProducts() {
      try {
        const response = await api.get('/products', {
          params: { limit: 10000 }
        });

        console.log('Products response:', response.data);

        const productsData = response.data?.data || response.data || [];

        if (Array.isArray(productsData)) {
          // Mapear productos con los nombres correctos de la BD
          this.products = productsData.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.code || p.sku,
            barcode: p.barcode,
            sale_price: p.price_1 || 0,
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
          console.warn('Products data is not an array:', productsData);
          this.products = [];
        }
      } catch (error) {
        console.error('Error loading products:', error);
        this.products = [];
      }
    },`;

  content = content.replace(oldLoadProducts, newLoadProducts);

  // ==================== FIX 3: Corregir loadWarehouses con nombre correcto ====================
  console.log('✓ Fix 3: Corrigiendo loadWarehouses con nombres reales de BD');

  const oldLoadWarehouses = `    async loadWarehouses() {
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

  const newLoadWarehouses = `    async loadWarehouses() {
      try {
        const response = await api.get('/warehouses', {
          params: { limit: 10000 }
        });

        console.log('Warehouses response:', response.data);

        const warehousesData = response.data?.data || response.data || [];

        if (Array.isArray(warehousesData)) {
          this.warehouses = warehousesData.map(w => ({
            label: w.nombre || w.name || w.warehouse_name || 'Sin nombre',
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

  // Guardar archivo
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('\n✅ NOMBRES DE COLUMNAS CORREGIDOS\n');
  console.log('Resumen de cambios:');
  console.log('  ✓ Customers: codigo, nombre, telefono, doc_identificacion');
  console.log('  ✓ Products: name, code (sku), price_1, stock, category_name');
  console.log('  ✓ Warehouses: nombre');
  console.log('  ✓ Productos ahora se mapean correctamente con todos los campos');
  console.log('\n🔄 Recarga la página del navegador');

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
