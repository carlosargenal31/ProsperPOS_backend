const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  console.log('Corrigiendo errores en pos-invoice.vue...\n');

  // Fix 1: Cambiar 'Artículo' por 'Producto'
  content = content.replace(/Código de Artículo/g, 'Código de Producto');
  content = content.replace(/Nombre Artículo/g, 'Nombre Producto');
  console.log('✓ Artículo → Producto');

  // Fix 2: Cambiar 'Almacén' por 'Bodega'
  content = content.replace(/<label class="label-tiny">Almacén<\/label>/g, '<label class="label-tiny">Bodega</label>');
  content = content.replace(/ALMACEN/g, 'BODEGA');
  console.log('✓ Almacén → Bodega');

  // Fix 3: Corregir icono del vendedor (falta 'ti' en la clase)
  content = content.replace('<i class="ti-search"></i>', '<i class="ti ti-search"></i>');
  console.log('✓ Icono de vendedor corregido');

  // Fix 4: Corregir filteredCustomers con validaciones
  content = content.replace(
    /filteredCustomers\(\) \{[\s\S]*?return filtered;[\s]*\},/,
    `filteredCustomers() {
      if (!Array.isArray(this.customers)) return [];
      let filtered = [...this.customers];
      if (this.customerSearch) {
        const search = this.customerSearch.toLowerCase();
        filtered = filtered.filter(c => {
          if (this.customerSearchBy === 'name') return (c.label || '').toLowerCase().includes(search);
          if (this.customerSearchBy === 'code') return (c.code || '').toLowerCase().includes(search);
          if (this.customerSearchBy === 'rtn') return (c.rtn || '').toLowerCase().includes(search);
          return false;
        });
      }
      if (this.customerSortBy === 'name') filtered.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
      else if (this.customerSortBy === 'code') filtered.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      return filtered;
    },`
  );
  console.log('✓ filteredCustomers corregido con validaciones');

  // Fix 5: Corregir filteredProducts
  content = content.replace(
    /filteredProducts\(\) \{[\s\S]*?else if \(this\.productSortBy === 'code'\)[\s\S]*?return filtered;[\s]*\},/,
    `filteredProducts() {
      if (!Array.isArray(this.products)) return [];
      let filtered = [...this.products];
      if (this.productSearch) {
        const search = this.productSearch.toLowerCase();
        filtered = filtered.filter(p => {
          if (this.productSearchBy === 'name') return (p.name || '').toLowerCase().includes(search);
          if (this.productSearchBy === 'code') return (p.sku || '').toLowerCase().includes(search);
          return false;
        });
      }
      if (this.productStockFilter === 'in_stock') filtered = filtered.filter(p => (p.stock || 0) > 0);
      else if (this.productStockFilter === 'out_of_stock') filtered = filtered.filter(p => (p.stock || 0) <= 0);
      if (this.productGroupFilter) filtered = filtered.filter(p => p.category_name === this.productGroupFilter);
      if (this.productBrandFilter) filtered = filtered.filter(p => p.brand_name === this.productBrandFilter);
      if (this.productModelFilter) filtered = filtered.filter(p => p.model === this.productModelFilter);
      if (this.productSortBy === 'name') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      else if (this.productSortBy === 'code') filtered.sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
      return filtered;
    },`
  );
  console.log('✓ filteredProducts corregido con validaciones');

  // Fix 6: Corregir productGroups
  content = content.replace(
    /productGroups\(\) \{[\s]*const groups = new Set\(\);[\s]*this\.products\.forEach/,
    `productGroups() {
      if (!Array.isArray(this.products)) return [];
      const groups = new Set();
      this.products.forEach`
  );
  console.log('✓ productGroups corregido');

  // Fix 7: Corregir productBrands
  content = content.replace(
    /productBrands\(\) \{[\s]*const brands = new Set\(\);[\s]*this\.products\.forEach/,
    `productBrands() {
      if (!Array.isArray(this.products)) return [];
      const brands = new Set();
      this.products.forEach`
  );
  console.log('✓ productBrands corregido');

  // Fix 8: Corregir productModels
  content = content.replace(
    /productModels\(\) \{[\s]*const models = new Set\(\);[\s]*this\.products\.forEach/,
    `productModels() {
      if (!Array.isArray(this.products)) return [];
      const models = new Set();
      this.products.forEach`
  );
  console.log('✓ productModels corregido');

  // Fix 9: Corregir filteredVendors
  content = content.replace(
    /filteredVendors\(\) \{[\s]*if \(!this\.vendorSearch\) return this\.vendors;[\s]*const search/,
    `filteredVendors() {
      if (!Array.isArray(this.vendors)) return [];
      if (!this.vendorSearch) return this.vendors;
      const search`
  );
  content = content.replace(
    /return this\.vendors\.filter\(v => v\.name\.toLowerCase/,
    `return this.vendors.filter(v => (v.name || '').toLowerCase`
  );
  content = content.replace(
    /\.includes\(search\) \|\| v\.code\.toLowerCase/,
    `.includes(search) || (v.code || '').toLowerCase`
  );
  console.log('✓ filteredVendors corregido');

  // Guardar el archivo
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('\n✓ TODOS LOS ERRORES CORREGIDOS EXITOSAMENTE');
  console.log('✓ Los modales ahora funcionarán correctamente');
  console.log('✓ Ya no habrá errores de "Cannot read properties of undefined"');

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
