const db = require('../src/utils/database');

async function insertTestSuppliers() {
  try {
    console.log('🔍 Checking existing suppliers...\n');

    // Check existing suppliers
    const [existingSuppliers] = await db.query('SELECT COUNT(*) as total FROM suppliers WHERE deleted_at IS NULL');
    console.log(`📊 Current suppliers in database: ${existingSuppliers[0].total}\n`);

    if (existingSuppliers[0].total > 0) {
      console.log('✅ Ya existen proveedores en la base de datos!\n');

      const [suppliers] = await db.query('SELECT id, nombre, doc_identificacion FROM suppliers WHERE deleted_at IS NULL');
      console.log('📋 Proveedores existentes:');
      suppliers.forEach((s, index) => {
        console.log(`  ${index + 1}. ${s.nombre} - RTN: ${s.doc_identificacion || 'N/A'}`);
      });

      process.exit(0);
      return;
    }

    console.log('📝 Insertando proveedores de prueba...\n');

    const testSuppliers = [
      {
        nombre: 'Distribuidora La Económica',
        tipo_proveedor: 'Distribuidor',
        doc_identificacion: '08011990123456',
        usa_credito: 1,
        tipo_beneficiario: '1',
        is_active: 1
      },
      {
        nombre: 'Alimentos del Valle S.A.',
        tipo_proveedor: 'Fabricante',
        doc_identificacion: '08011985987654',
        usa_credito: 1,
        tipo_beneficiario: '1',
        is_active: 1
      },
      {
        nombre: 'Comercial Honduras',
        tipo_proveedor: 'Mayorista',
        doc_identificacion: '08012000111222',
        usa_credito: 0,
        tipo_beneficiario: '1',
        is_active: 1
      },
      {
        nombre: 'Proveedor Express',
        tipo_proveedor: 'Distribuidor',
        doc_identificacion: '08012005333444',
        usa_credito: 1,
        tipo_beneficiario: '1',
        is_active: 1
      },
      {
        nombre: 'Importadora Central',
        tipo_proveedor: 'Importador',
        doc_identificacion: '08011995555666',
        usa_credito: 1,
        tipo_beneficiario: '1',
        is_active: 1
      }
    ];

    for (const supplier of testSuppliers) {
      const query = `
        INSERT INTO suppliers (
          nombre, tipo_proveedor, doc_identificacion,
          usa_credito, tipo_beneficiario, is_active,
          created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
      `;

      const [result] = await db.query(query, [
        supplier.nombre,
        supplier.tipo_proveedor,
        supplier.doc_identificacion,
        supplier.usa_credito,
        supplier.tipo_beneficiario,
        supplier.is_active
      ]);

      console.log(`✅ Insertado: ${supplier.nombre} (ID: ${result.insertId})`);
    }

    console.log('\n🎉 ¡Todos los proveedores insertados exitosamente!\n');

    // Show inserted suppliers
    const [insertedSuppliers] = await db.query(`
      SELECT id, nombre, doc_identificacion, tipo_proveedor, is_active
      FROM suppliers
      WHERE deleted_at IS NULL
      ORDER BY id ASC
    `);

    console.log('📋 Proveedores en base de datos:');
    insertedSuppliers.forEach((s, index) => {
      console.log(`  ${index + 1}. ID: ${s.id} | ${s.nombre} | RTN: ${s.doc_identificacion} | Tipo: ${s.tipo_proveedor}`);
    });

    console.log('\n✅ ¡Ahora puedes seleccionar proveedores en el formulario de compras!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error insertando proveedores:', error.message);
    console.error(error);
    process.exit(1);
  }
}

insertTestSuppliers();
