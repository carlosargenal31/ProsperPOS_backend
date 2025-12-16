const db = require('./src/utils/database');

async function addBranchIdColumn() {
  try {
    console.log('🔧 Agregando columna branch_id a la tabla invoices...');

    // Agregar columna branch_id
    await db.execute(`
      ALTER TABLE invoices
      ADD COLUMN branch_id INT DEFAULT 1 COMMENT 'ID de la sucursal (branches)' AFTER warehouse_id
    `);
    console.log('✅ Columna branch_id agregada');

    // Actualizar facturas existentes
    await db.execute('UPDATE invoices SET branch_id = 1 WHERE branch_id IS NULL');
    console.log('✅ Facturas actualizadas con branch_id = 1');

    // Crear índice
    await db.execute('CREATE INDEX idx_invoices_branch_id ON invoices(branch_id)');
    console.log('✅ Índice creado');

    // Verificar
    const result = await db.execute('SHOW COLUMNS FROM invoices LIKE "branch_id"');
    console.log('✅ Verificación:', result);

    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  La columna branch_id ya existe');
      process.exit(0);
    }
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addBranchIdColumn();
