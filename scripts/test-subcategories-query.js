// Script para probar consultas de subcategor�as
const db = require('../src/utils/database');

async function testQuery() {
  try {
    await db.connectDatabase();

    console.log('>� Probando consulta de categor�as activas...\n');

    const query = `
      SELECT
        c.id,
        c.name,
        c.image_url,
        c.is_active
      FROM categories c
      WHERE c.is_active = 1 AND c.deleted_at IS NULL
      ORDER BY c.id ASC
    `;

    const result = await db.execute(query);

    console.log(' Consulta exitosa');
    console.log('=� Tipo de resultado:', typeof result);
    console.log('=� Es array:', Array.isArray(result));
    console.log('=� Cantidad de categor�as:', result.length);
    console.log('\n=� Primeras 5 categor�as:');
    console.log(result.slice(0, 5));

    await db.closeDatabase();
    process.exit(0);

  } catch (error) {
    console.error('L Error:', error);
    process.exit(1);
  }
}

testQuery();
