const db = require('../src/utils/database');

async function testSuppliers() {
  try {
    console.log('🔍 Consultando suppliers directamente desde la BD...\n');

    const query = `
      SELECT s.*,
             bt.nombre as beneficiary_type_name
      FROM suppliers s
      LEFT JOIN beneficiary_types bt ON s.tipo_beneficiario = bt.id
      WHERE s.deleted_at IS NULL
      ORDER BY s.id ASC
    `;

    const [suppliers] = await db.query(query);

    console.log('📊 Total proveedores:', suppliers.length);
    console.log('\n📋 Estructura de la respuesta que enviará el backend:');

    const response = {
      success: true,
      message: 'Proveedores obtenidos exitosamente',
      data: suppliers,  // ⭐ AQUÍ ESTÁN LOS DATOS
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify(response, null, 2));

    console.log('\n\n🎯 ANÁLISIS:');
    console.log('response.data =', Array.isArray(response.data) ? `Array con ${response.data.length} elementos` : typeof response.data);
    console.log('response.data.data =', response.data.data || 'undefined (NO EXISTE!)');

    console.log('\n\n✅ El frontend debe usar: response.data (NO response.data.data)');

    if (suppliers.length > 0) {
      console.log('\n📝 Primer proveedor:');
      console.log(JSON.stringify(suppliers[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testSuppliers();
