// Script para probar el query completo de productos vendidos con todos los campos
require('dotenv').config();
const SoldItemsService = require('./src/services/sold-items.service');

async function testCompleteQuery() {
  try {
    console.log('=== Probando Query Completo de Productos Vendidos ===\n');

    // Filtros básicos con todas las columnas
    const filters = {
      date_from: '2024-01-01',
      date_to: new Date().toISOString().split('T')[0],
      include_categories: true,
      include_subcategories: true,
      include_brands: true,
      show_costs: true,
      show_utility: true
    };

    console.log('Filtros:', filters);
    console.log('\nEjecutando consulta...\n');

    const result = await SoldItemsService.getSoldItems(filters);

    console.log(`✓ Productos encontrados: ${result.items.length}\n`);

    if (result.items.length > 0) {
      console.log('Top 5 productos con todos los datos:');
      console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
      console.log(
        'Código'.padEnd(12),
        'Producto'.padEnd(25),
        'Categoría'.padEnd(15),
        'Marca'.padEnd(12),
        'Cant'.padStart(8),
        'Costo'.padStart(10),
        'Utilidad'.padStart(12)
      );
      console.log('───────────────────────────────────────────────────────────────────────────────────────────────');

      result.items.slice(0, 5).forEach((item, idx) => {
        console.log(
          `${idx + 1}.`.padStart(3),
          String(item.codigo || '').substring(0, 11).padEnd(11),
          String(item.producto || '').substring(0, 24).padEnd(24),
          String(item.categoria || '-').substring(0, 14).padEnd(14),
          String(item.marca || '-').substring(0, 11).padEnd(11),
          String(item.cantidad || 0).padStart(8),
          `L${parseFloat(item.costo || 0).toFixed(2)}`.padStart(10),
          `L${parseFloat(item.utilidad || 0).toFixed(2)}`.padStart(12)
        );
      });

      console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');

      console.log('\n📊 TOTALES:');
      console.log(`   Cantidad Total:    ${result.totals.total_cantidad.toFixed(2)}`);
      console.log(`   Total Neto:        L ${result.totals.total_neto.toFixed(2)}`);
      console.log(`   Total Impuesto:    L ${result.totals.total_impuesto.toFixed(2)}`);
      console.log(`   Total Final:       L ${result.totals.total_final.toFixed(2)}`);
      console.log(`   Total Costo:       L ${result.totals.total_costo.toFixed(2)}`);
      console.log(`   Total Utilidad:    L ${result.totals.total_utilidad.toFixed(2)}`);

      // Verificar que los campos existen
      console.log('\n🔍 Verificación de campos en el primer registro:');
      const firstItem = result.items[0];
      console.log('   ✓ codigo:', firstItem.codigo ? 'OK' : 'FALTA');
      console.log('   ✓ producto:', firstItem.producto ? 'OK' : 'FALTA');
      console.log('   ✓ categoria:', firstItem.categoria !== undefined ? 'OK' : 'FALTA');
      console.log('   ✓ subcategoria:', firstItem.subcategoria !== undefined ? 'OK' : 'FALTA');
      console.log('   ✓ marca:', firstItem.marca !== undefined ? 'OK' : 'FALTA');
      console.log('   ✓ cantidad:', firstItem.cantidad ? 'OK' : 'FALTA');
      console.log('   ✓ costo:', firstItem.costo !== undefined ? 'OK' : 'FALTA');
      console.log('   ✓ total_costo:', firstItem.total_costo !== undefined ? 'OK' : 'FALTA');
      console.log('   ✓ utilidad:', firstItem.utilidad !== undefined ? 'OK' : 'FALTA');
    } else {
      console.log('⚠️  No se encontraron productos vendidos en el rango de fechas.');
    }

    console.log('\n✅ Prueba completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en la prueba:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCompleteQuery();
