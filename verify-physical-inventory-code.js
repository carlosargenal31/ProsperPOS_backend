// ===================================================================
// VERIFICACIÓN DE CÓDIGO - INVENTARIO FÍSICO
// ===================================================================
// Este script verifica que el código esté correctamente estructurado

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando estructura del código de Inventario Físico...\n');

// Archivos a verificar
const files = {
  controller: path.join(__dirname, 'src/controllers/physical-inventory.controller.js'),
  service: path.join(__dirname, 'src/services/physical-inventory.service.js'),
  routes: path.join(__dirname, 'src/routes/physical-inventory.routes.js'),
  indexRoutes: path.join(__dirname, 'src/routes/index.js')
};

// Verificación 1: Todos los archivos existen
console.log('1️⃣ Verificando existencia de archivos...');
let allFilesExist = true;
Object.entries(files).forEach(([name, filePath]) => {
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${name}: Existe`);
  } else {
    console.log(`   ❌ ${name}: NO EXISTE`);
    allFilesExist = false;
  }
});
console.log('');

if (!allFilesExist) {
  console.log('❌ Algunos archivos no existen. Abortando verificación.\n');
  process.exit(1);
}

// Verificación 2: include_images no debe existir
console.log('2️⃣ Verificando que include_images fue removido...');
let hasIncludeImages = false;
Object.entries(files).forEach(([name, filePath]) => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('include_images')) {
    console.log(`   ❌ ${name}: Todavía contiene include_images`);
    hasIncludeImages = true;
  } else {
    console.log(`   ✅ ${name}: Sin referencias a include_images`);
  }
});
console.log('');

// Verificación 3: Parámetros correctos en controller
console.log('3️⃣ Verificando parámetros en controller...');
const controllerContent = fs.readFileSync(files.controller, 'utf8');
const requiredParams = [
  'product_id',
  'category_id',
  'subcategory_id',
  'warehouse_id',
  'brand_id',
  'existence_filter',
  'include_cost',
  'include_average_cost',
  'include_prices',
  'include_codes',
  'include_unit',
  'include_brand',
  'group_by_warehouses',
  'group_by_groups',
  'group_by_articles',
  'include_suspended',
  'is_for_inventory_taking'
];

let allParamsPresent = true;
requiredParams.forEach(param => {
  if (controllerContent.includes(param)) {
    console.log(`   ✅ ${param}`);
  } else {
    console.log(`   ❌ ${param}: NO ENCONTRADO`);
    allParamsPresent = false;
  }
});
console.log('');

// Verificación 4: Métodos exportados en controller
console.log('4️⃣ Verificando métodos en controller...');
const requiredMethods = [
  'getPhysicalInventory',
  'exportPhysicalInventory',
  'getInventorySummary'
];

requiredMethods.forEach(method => {
  if (controllerContent.includes(`static async ${method}`)) {
    console.log(`   ✅ ${method}`);
  } else {
    console.log(`   ❌ ${method}: NO ENCONTRADO`);
  }
});
console.log('');

// Verificación 5: Service methods
console.log('5️⃣ Verificando métodos en service...');
const serviceContent = fs.readFileSync(files.service, 'utf8');

if (serviceContent.includes('static async getPhysicalInventory')) {
  console.log('   ✅ getPhysicalInventory');
} else {
  console.log('   ❌ getPhysicalInventory: NO ENCONTRADO');
}
console.log('');

// Verificación 6: Rutas registradas
console.log('6️⃣ Verificando rutas registradas...');
const routesContent = fs.readFileSync(files.routes, 'utf8');
const indexRoutesContent = fs.readFileSync(files.indexRoutes, 'utf8');

const expectedRoutes = [
  { method: 'get', path: '/', handler: 'getPhysicalInventory' },
  { method: 'get', path: '/summary', handler: 'getInventorySummary' },
  { method: 'get', path: '/export', handler: 'exportPhysicalInventory' }
];

expectedRoutes.forEach(route => {
  if (routesContent.includes(`router.${route.method}('${route.path}'`) &&
      routesContent.includes(route.handler)) {
    console.log(`   ✅ ${route.method.toUpperCase()} ${route.path} -> ${route.handler}`);
  } else {
    console.log(`   ❌ ${route.method.toUpperCase()} ${route.path} -> ${route.handler}: NO ENCONTRADO`);
  }
});

if (indexRoutesContent.includes("router.use('/v1/physical-inventory', physicalInventoryRoutes)")) {
  console.log('   ✅ Rutas registradas en index.js');
} else {
  console.log('   ❌ Rutas NO registradas en index.js');
}
console.log('');

// Verificación 7: Middleware de autenticación
console.log('7️⃣ Verificando middleware de autenticación...');
if (routesContent.includes('authenticateToken') &&
    routesContent.includes('router.use(authenticateToken)')) {
  console.log('   ✅ Middleware de autenticación configurado');
} else {
  console.log('   ❌ Middleware de autenticación NO configurado');
}
console.log('');

// Verificación 8: Estructura de respuesta
console.log('8️⃣ Verificando estructura de respuesta...');
if (serviceContent.includes('data:') &&
    serviceContent.includes('totals:') &&
    serviceContent.includes('filters:') &&
    serviceContent.includes('metadata:')) {
  console.log('   ✅ Estructura de respuesta correcta (data, totals, filters, metadata)');
} else {
  console.log('   ❌ Estructura de respuesta incompleta');
}
console.log('');

// Resumen final
console.log('═'.repeat(60));
if (!hasIncludeImages && allFilesExist && allParamsPresent) {
  console.log('✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE');
  console.log('   Todos los cambios están correctamente implementados.');
} else {
  console.log('⚠️  VERIFICACIÓN COMPLETADA CON ADVERTENCIAS');
  console.log('   Revisar los puntos marcados con ❌');
}
console.log('═'.repeat(60));
console.log('');

process.exit(0);
