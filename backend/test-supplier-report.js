// Script de prueba para el servicio de reporte de proveedores
const SupplierReportService = require('./src/services/supplier-report.service');

async function testSupplierReport() {
  try {
    console.log('====================================');
    console.log('PROBANDO SERVICIO DE REPORTE DE PROVEEDORES');
    console.log('====================================\n');

    // Test 1: Obtener compras por proveedor
    console.log('1. Probando getPurchasesBySupplier...');
    const filters = {
      date_from: '2024-01-01',
      date_to: '2025-12-31'
    };

    const report = await SupplierReportService.getPurchasesBySupplier(filters);
    console.log('✓ Reporte obtenido exitosamente');
    console.log(`  - Total de proveedores: ${report.suppliers.length}`);
    console.log(`  - Total de compras: ${report.totals.total_purchases}`);
    console.log(`  - Monto total: L ${report.totals.total_con_isv}`);

    if (report.suppliers.length > 0) {
      console.log(`\n  Primeros 3 proveedores:`);
      report.suppliers.slice(0, 3).forEach((sup, index) => {
        console.log(`  ${index + 1}. ${sup.supplier_name} - L ${sup.total_con_isv} (${sup.total_purchases} compras)`);
      });
    }

    // Test 2: Obtener lista de proveedores
    console.log('\n2. Probando getSuppliersList...');
    const suppliers = await SupplierReportService.getSuppliersList();
    console.log(`✓ Lista de proveedores obtenida: ${suppliers.length} proveedores`);

    // Test 3: Obtener top proveedores
    console.log('\n3. Probando getTopSuppliers...');
    const topSuppliers = await SupplierReportService.getTopSuppliers({ limit: 5 });
    console.log(`✓ Top 5 proveedores obtenidos: ${topSuppliers.top_suppliers.length} resultados`);

    if (topSuppliers.top_suppliers.length > 0) {
      console.log('\n  Top Proveedores:');
      topSuppliers.top_suppliers.forEach((sup, index) => {
        console.log(`  ${index + 1}. ${sup.supplier_name} - L ${sup.total_amount} (${sup.total_purchases} compras)`);
      });
    }

    // Test 4: Obtener compras por periodo
    console.log('\n4. Probando getPurchasesByPeriod...');
    const byPeriod = await SupplierReportService.getPurchasesByPeriod({
      period: 'month',
      date_from: '2024-01-01',
      date_to: '2025-12-31'
    });
    console.log(`✓ Compras por periodo obtenidas: ${byPeriod.periods.length} periodos`);

    // Test 5: Obtener información de la empresa
    console.log('\n5. Probando getCompanyInfo...');
    const company = await SupplierReportService.getCompanyInfo();
    console.log(`✓ Información de empresa obtenida: ${company.company_name}`);

    // Test 6: Detalle de proveedor (si hay proveedores)
    if (report.suppliers.length > 0) {
      console.log('\n6. Probando getSupplierPurchasesDetail...');
      const supplierName = report.suppliers[0].supplier_name;
      const detail = await SupplierReportService.getSupplierPurchasesDetail(supplierName, filters);
      console.log(`✓ Detalle de ${supplierName} obtenido`);
      console.log(`  - Compras: ${detail.totals.total_purchases}`);
      console.log(`  - Total: L ${detail.totals.total_con_isv}`);
    }

    console.log('\n====================================');
    console.log('TODAS LAS PRUEBAS COMPLETADAS ✓');
    console.log('====================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar pruebas
testSupplierReport();
