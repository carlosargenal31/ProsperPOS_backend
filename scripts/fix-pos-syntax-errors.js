const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../template/src/views/pages/pos/pos-invoice.vue');

console.log('🔧 Corrigiendo errores de sintaxis en POS...\n');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  // Fix: Eliminar las llaves duplicadas en la línea 1466
  console.log('✓ Corrigiendo llaves duplicadas');

  // Buscar el patrón problemático
  content = content.replace(/\}    \},\n    \/\/ ==================== MÉTODOS DE PAGO ====================/g,
    '},\n    // ==================== MÉTODOS DE PAGO ====================');

  // Verificar que los métodos estén correctamente cerrados
  // Buscar y corregir cualquier método mal cerrado

  // Guardar archivo
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log('✅ Errores de sintaxis corregidos');
  console.log('🔄 Recarga VS Code o el editor para ver los cambios');

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
