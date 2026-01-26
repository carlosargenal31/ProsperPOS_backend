require('dotenv').config();
const db = require('./src/utils/database');

async function test() {
  try {
    // Check if table exists
    const tables = await db.execute('SHOW TABLES LIKE "offers"');
    console.log('✓ Tabla "offers":', tables.length > 0 ? 'EXISTE' : 'NO EXISTE');

    if (tables.length > 0) {
      // Count records
      const count = await db.execute('SELECT COUNT(*) as count FROM offers');
      console.log('✓ Total ofertas:', count[0].count);

      // Show sample
      const sample = await db.execute('SELECT * FROM offers LIMIT 3');
      console.log('✓ Ejemplo de ofertas:');
      sample.forEach((offer, i) => {
        console.log(`  ${i + 1}. ID: ${offer.id}, Código: ${offer.codigo}, Nombre: ${offer.nombre}, Activa: ${offer.is_active}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

test();
