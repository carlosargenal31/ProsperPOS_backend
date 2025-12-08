// ===================================================================
// VERIFICAR TABLA DE CONSECUTIVOS
// ===================================================================

const db = require('../src/utils/database');

async function verifyConsecutivesTable() {
  console.log('🔍 VERIFICANDO TABLA DE CONSECUTIVOS\n');

  try {
    // 1. Verificar si la tabla existe
    console.log('1️⃣ Verificando existencia de la tabla...');
    const tables = await db.query("SHOW TABLES LIKE 'consecutives'");

    if (tables.length === 0) {
      console.log('❌ La tabla consecutives NO existe');
      console.log('📝 Ejecuta: mysql -u root -p310104 prosperpos < backend/database/create-consecutives-table.sql\n');
      process.exit(1);
    }

    console.log('✅ La tabla consecutives existe\n');

    // 2. Verificar estructura
    console.log('2️⃣ Estructura de la tabla:');
    const structure = await db.query("DESCRIBE consecutives");
    console.table(structure);
    console.log('');

    // 3. Verificar datos
    console.log('3️⃣ Datos actuales en la tabla:');
    const data = await db.query("SELECT * FROM consecutives");

    if (data.length === 0) {
      console.log('⚠️  La tabla está vacía. Insertando datos iniciales...\n');

      await db.query(`
        INSERT INTO consecutives (document_type, current_number, prefix, padding, description)
        VALUES
          ('quote', 1, NULL, 10, 'Consecutivo para cotizaciones'),
          ('pending_invoice', 1, NULL, 10, 'Consecutivo para facturas en espera'),
          ('invoice', 31839, '000-002-01-', 8, 'Consecutivo para facturas')
        ON DUPLICATE KEY UPDATE current_number = current_number
      `);

      console.log('✅ Datos iniciales insertados\n');

      const newData = await db.query("SELECT * FROM consecutives");
      console.table(newData);
    } else {
      console.table(data);
    }

    console.log('\n✅ VERIFICACIÓN COMPLETADA\n');

    // 4. Mostrar resumen
    console.log('📊 RESUMEN:');
    console.log(`   - Total de tipos de consecutivos: ${data.length || 3}`);
    data.forEach(row => {
      console.log(`   - ${row.document_type}: consecutivo actual = ${row.current_number}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

verifyConsecutivesTable();
