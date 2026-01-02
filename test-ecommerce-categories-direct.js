// Test DIRECTO sin servidor
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testCategories() {
  console.log('🔍 Testing categories query DIRECTLY...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  console.log('✅ Connected to database\n');

  // Test 1: Ver columnas de categories
  console.log('1️⃣ Checking categories columns...');
  const [columns] = await connection.query('SHOW COLUMNS FROM categories');
  console.log('Columns:', columns.map(c => c.Field).join(', '));
  const hasImageUrl = columns.some(c => c.Field === 'image_url');
  console.log(`   - image_url exists: ${hasImageUrl ? '✅ YES' : '❌ NO'}\n`);

  // Test 2: Ver columnas de products
  console.log('2️⃣ Checking products columns...');
  const [prodColumns] = await connection.query('SHOW COLUMNS FROM products');
  console.log('Columns:', prodColumns.map(c => c.Field).join(', '));
  const hasStatus = prodColumns.some(c => c.Field === 'status');
  console.log(`   - status exists: ${hasStatus ? '✅ YES' : '❌ NO'}\n`);

  // Test 3: Ejecutar la query
  console.log('3️⃣ Running the categories query...');
  try {
    const query = `
      SELECT
        c.id,
        c.name,
        c.image_url,
        COUNT(DISTINCT p.id) as products_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
      WHERE c.is_active = 1 AND c.deleted_at IS NULL
      GROUP BY c.id
      HAVING products_count > 0
      ORDER BY c.name ASC
    `;

    const [categories] = await connection.query(query);
    console.log(`✅ SUCCESS! Found ${categories.length} categories\n`);

    categories.forEach((cat, i) => {
      console.log(`   ${i + 1}. ${cat.name}`);
      console.log(`      - ID: ${cat.id}`);
      console.log(`      - Image: ${cat.image_url || 'NO IMAGE'}`);
      console.log(`      - Products: ${cat.products_count}`);
    });

  } catch (error) {
    console.error('❌ QUERY ERROR:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   SQL: ${error.sql}\n`);
  }

  await connection.end();
}

testCategories().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
