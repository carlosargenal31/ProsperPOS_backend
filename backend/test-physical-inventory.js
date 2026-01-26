// ===================================================================
// TEST - PHYSICAL INVENTORY API
// ===================================================================
// Este script prueba todos los endpoints del módulo de inventario físico

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Coloca aquí tu token de autenticación
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJjYXJsb3MiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzQ0MDQ2NzQsImV4cCI6MTczNDQwODI3NH0.7H3PZJmGkHzRQQ9Y-g5j9p1p7QX9X9X9X9X9X9X9X9X'; // Reemplaza con tu token real

const config = {
  headers: {
    'Authorization': `Bearer ${TOKEN}`
  }
};

async function testEndpoints() {
  console.log('🧪 Iniciando pruebas de Physical Inventory API...\n');

  try {
    // Test 1: Verificar endpoints de catálogos
    console.log('1️⃣ Probando carga de catálogos...');

    const catalogTests = [
      { name: 'Categories', url: '/categories' },
      { name: 'Subcategories', url: '/subcategories' },
      { name: 'Warehouses', url: '/warehouses' },
      { name: 'Brands', url: '/brands' },
      { name: 'Products', url: '/products?limit=9999' }
    ];

    for (const test of catalogTests) {
      try {
        const response = await axios.get(`${BASE_URL}${test.url}`, config);
        if (response.data.success) {
          const count = response.data.data?.length || 0;
          console.log(`   ✅ ${test.name}: ${count} registros`);
        } else {
          console.log(`   ❌ ${test.name}: Sin datos`);
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: Error - ${error.message}`);
      }
    }

    console.log('\n2️⃣ Probando endpoint de inventario físico...');

    // Test 2: Inventario básico
    try {
      const response = await axios.get(`${BASE_URL}/physical-inventory`, config);
      if (response.data.success) {
        console.log(`   ✅ Inventario básico: ${response.data.data.length} bodegas`);
        console.log(`   📊 Totales:`, response.data.totals);
      } else {
        console.log(`   ❌ Inventario básico: Sin datos`);
      }
    } catch (error) {
      console.log(`   ❌ Inventario básico: Error - ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Inventario con filtros
    console.log('\n3️⃣ Probando filtros...');

    const filterTests = [
      { name: 'Con stock', params: 'existence_filter=with_stock' },
      { name: 'Sin stock', params: 'existence_filter=without_stock' },
      { name: 'Incluir costos', params: 'include_cost=true' },
      { name: 'Incluir precios', params: 'include_prices=true' },
      { name: 'Agrupar por categorías', params: 'group_by_groups=true' },
      { name: 'Agrupar por productos', params: 'group_by_articles=true' }
    ];

    for (const test of filterTests) {
      try {
        const response = await axios.get(`${BASE_URL}/physical-inventory?${test.params}`, config);
        if (response.data.success) {
          const dataLength = Array.isArray(response.data.data) ? response.data.data.length : Object.keys(response.data.data).length;
          console.log(`   ✅ ${test.name}: ${dataLength} registros`);
        } else {
          console.log(`   ❌ ${test.name}: Sin datos`);
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: Error - ${error.response?.data?.message || error.message}`);
      }
    }

    // Test 4: Inventario por bodega específica
    console.log('\n4️⃣ Probando filtro por bodega...');

    try {
      // Primero obtenemos las bodegas
      const warehousesRes = await axios.get(`${BASE_URL}/warehouses`, config);
      if (warehousesRes.data.success && warehousesRes.data.data.length > 0) {
        const firstWarehouse = warehousesRes.data.data[0];
        const response = await axios.get(`${BASE_URL}/physical-inventory?warehouse_id=${firstWarehouse.id}`, config);
        if (response.data.success) {
          console.log(`   ✅ Bodega "${firstWarehouse.nombre}": Inventario cargado`);
        } else {
          console.log(`   ❌ Bodega "${firstWarehouse.nombre}": Sin datos`);
        }
      } else {
        console.log(`   ⚠️  No hay bodegas para probar`);
      }
    } catch (error) {
      console.log(`   ❌ Filtro por bodega: Error - ${error.response?.data?.message || error.message}`);
    }

    // Test 5: Resumen de inventario
    console.log('\n5️⃣ Probando resumen de inventario...');

    try {
      const response = await axios.get(`${BASE_URL}/physical-inventory/summary`, config);
      if (response.data.success) {
        console.log(`   ✅ Resumen: Datos obtenidos correctamente`);
      } else {
        console.log(`   ❌ Resumen: Sin datos`);
      }
    } catch (error) {
      console.log(`   ❌ Resumen: Error - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n✅ Pruebas completadas!\n');

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testEndpoints();
