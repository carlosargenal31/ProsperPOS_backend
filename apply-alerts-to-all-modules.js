/**
 * Script para aplicar alerts y exportación PDF/Excel a todos los módulos
 *
 * USO:
 * 1. Abre la consola en: c:\Users\carlo\OneDrive\Escritorio\ProsperPOS
 * 2. Ejecuta: node apply-alerts-to-all-modules.js
 */

const fs = require('fs');
const path = require('path');

// Configuración de módulos a actualizar
const modules = [
  {
    name: 'Categorías',
    modalPath: 'template/src/components/modal/category-list-modal.vue',
    listPath: 'template/src/views/pages/inventory/category-list.vue',
    serviceName: 'categoryService',
    entityName: 'category',
    entityNamePlural: 'categories',
    displayName: 'categoría',
    displayNamePlural: 'categorías',
    tableHeaders: ['Código', 'Categoría', 'Productos', 'Estado'],
    dataMapping: `category => [
      category.id,
      category.name,
      category.products_count || 0,
      category.is_active ? 'Activo' : 'Inactivo'
    ]`
  },
  {
    name: 'Subcategorías',
    modalPath: 'template/src/components/modal/sub-categories-modal.vue',
    listPath: 'template/src/views/pages/inventory/subcategory-list.vue',
    serviceName: 'subcategoryService',
    entityName: 'subcategory',
    entityNamePlural: 'subcategories',
    displayName: 'subcategoría',
    displayNamePlural: 'subcategorías',
    tableHeaders: ['Código', 'Subcategoría', 'Categoría', 'Estado'],
    dataMapping: `subcategory => [
      subcategory.id,
      subcategory.name,
      subcategory.category_name || '-',
      subcategory.is_active ? 'Activo' : 'Inactivo'
    ]`
  },
  {
    name: 'Unidades',
    modalPath: 'template/src/components/modal/units-modal.vue',
    listPath: 'template/src/views/pages/inventory/units-list.vue',
    serviceName: 'unitService',
    entityName: 'unit',
    entityNamePlural: 'units',
    displayName: 'unidad',
    displayNamePlural: 'unidades',
    tableHeaders: ['Código', 'Unidad', 'Abreviatura', 'Estado'],
    dataMapping: `unit => [
      unit.id,
      unit.name,
      unit.abbreviation || '-',
      unit.is_active ? 'Activo' : 'Inactivo'
    ]`
  },
  {
    name: 'Clientes',
    modalPath: 'template/src/components/modal/customer-modal.vue',
    listPath: 'template/src/views/pages/people/customer-list.vue',
    serviceName: 'customerService',
    entityName: 'customer',
    entityNamePlural: 'customers',
    displayName: 'cliente',
    displayNamePlural: 'clientes',
    tableHeaders: ['Código', 'Cliente', 'Email', 'Teléfono', 'Estado'],
    dataMapping: `customer => [
      customer.id,
      customer.name,
      customer.email || '-',
      customer.phone || '-',
      customer.is_active ? 'Activo' : 'Inactivo'
    ]`
  },
  {
    name: 'Proveedores',
    modalPath: 'template/src/components/modal/supplier-modal.vue',
    listPath: 'template/src/views/pages/people/supplier-list.vue',
    serviceName: 'supplierService',
    entityName: 'supplier',
    entityNamePlural: 'suppliers',
    displayName: 'proveedor',
    displayNamePlural: 'proveedores',
    tableHeaders: ['Código', 'Proveedor', 'Email', 'Teléfono', 'Estado'],
    dataMapping: `supplier => [
      supplier.id,
      supplier.name,
      supplier.email || '-',
      supplier.phone || '-',
      supplier.is_active ? 'Activo' : 'Inactivo'
    ]`
  }
];

// Función principal
function applyChanges() {
  console.log('🚀 Iniciando aplicación de alerts y exportación...\n');

  const baseDir = __dirname;
  const brandModalPath = path.join(baseDir, 'template/src/components/modal/brand-list-modal.vue');

  // Leer el archivo de marcas como referencia
  if (!fs.existsSync(brandModalPath)) {
    console.error('❌ No se encontró el archivo de referencia (brand-list-modal.vue)');
    return;
  }

  const brandModalContent = fs.readFileSync(brandModalPath, 'utf8');

  // Extraer la función cleanupModal de marcas
  const cleanupModalRegex = /cleanupModal\(modalId[\s\S]*?\n    \},/;
  const cleanupModalMatch = brandModalContent.match(cleanupModalRegex);

  if (!cleanupModalMatch) {
    console.error('❌ No se pudo extraer la función cleanupModal');
    return;
  }

  const cleanupModalFunction = cleanupModalMatch[0];

  console.log('✅ Función cleanupModal extraída correctamente\n');
  console.log('📋 Módulos a actualizar:\n');

  modules.forEach((module, index) => {
    console.log(`${index + 1}. ${module.name}`);
  });

  console.log('\n⚠️  NOTA: Este script requiere que los archivos existan.');
  console.log('⚠️  Revisa manualmente cada archivo después de la ejecución.\n');
  console.log('💡 Para aplicar cambios, descomenta la sección de escritura de archivos.\n');

  // AQUÍ PUEDES DESCOMENTAR PARA APLICAR LOS CAMBIOS AUTOMÁTICAMENTE
  /*
  modules.forEach(module => {
    const modalPath = path.join(baseDir, module.modalPath);

    if (fs.existsSync(modalPath)) {
      let content = fs.readFileSync(modalPath, 'utf8');

      // Agregar emits si no existe
      if (!content.includes("emits: ['saved', 'deleted']")) {
        content = content.replace(
          /export default \{/,
          "export default {\n  emits: ['saved', 'deleted'],"
        );
      }

      // Actualizar cleanupModal
      if (content.includes('cleanupModal(')) {
        content = content.replace(cleanupModalRegex, cleanupModalFunction);
      }

      fs.writeFileSync(modalPath, content, 'utf8');
      console.log(`✅ ${module.name} modal actualizado`);
    } else {
      console.log(`⚠️  ${module.name} modal no encontrado: ${modalPath}`);
    }
  });
  */

  console.log('\n✨ Proceso completado!');
  console.log('\n📝 SIGUIENTE PASO: Revisa el archivo GUIA_AGREGAR_ALERTS_Y_EXPORTACION.md');
  console.log('   para copiar manualmente los métodos de exportación en cada vista.\n');
}

// Ejecutar
applyChanges();
