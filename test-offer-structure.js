require('dotenv').config();
const db = require('./src/utils/database');

async function test() {
  try {
    // Get table structure
    const columns = await db.execute('DESCRIBE offers');
    console.log('✓ Estructura de la tabla "offers":\n');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Get one offer with all fields
    console.log('\n✓ Ejemplo de una oferta con todos sus campos:');
    const offers = await db.execute('SELECT * FROM offers WHERE is_active = 1 LIMIT 1');
    if (offers.length > 0) {
      console.log(JSON.stringify(offers[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

test();
