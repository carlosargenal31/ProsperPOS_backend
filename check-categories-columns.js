const db = require('./src/utils/database.js');

(async () => {
  try {
    console.log('Checking categories table columns...\n');

    const columns = await db.execute('SHOW COLUMNS FROM categories');

    console.log('Columns found:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    console.log('\nChecking for image_url column...');
    const hasImageUrl = columns.some(col => col.Field === 'image_url');

    if (hasImageUrl) {
      console.log('✅ image_url column EXISTS');
    } else {
      console.log('❌ image_url column DOES NOT EXIST');
      console.log('\nYou need to add it with:');
      console.log('ALTER TABLE categories ADD COLUMN image_url VARCHAR(500) AFTER name;');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
