const db = require('./src/utils/database');

async function createPurchasesDocumentsItemsTable() {
  try {
    console.log('Creating purchases_documents_items table...');

    // Primero verificar si existe la tabla purchase_items
    const [existingTables] = await db.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'prosperpos'
        AND TABLE_NAME IN ('purchase_items', 'purchases_documents_items')
    `);

    console.log('Existing tables:', existingTables);

    // Si existe purchase_items, copiar su estructura
    if (existingTables.some(t => t.TABLE_NAME === 'purchase_items')) {
      console.log('Table purchase_items exists, creating purchases_documents_items with same structure...');

      // Crear la tabla basada en purchase_items
      await db.query(`
        CREATE TABLE IF NOT EXISTS purchases_documents_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_id INT NOT NULL,
          product_id INT,
          product_code VARCHAR(100),
          product_name VARCHAR(255) NOT NULL,
          quantity DECIMAL(15,3) NOT NULL,
          unit_price DECIMAL(15,2) NOT NULL,
          discount_percentage DECIMAL(5,2) DEFAULT 0,
          discount_amount DECIMAL(15,2) DEFAULT 0,
          tax_percentage DECIMAL(5,2) DEFAULT 0,
          tax_amount DECIMAL(15,2) DEFAULT 0,
          subtotal DECIMAL(15,2) NOT NULL,
          total DECIMAL(15,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (purchase_id) REFERENCES purchases_documents(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('✅ Table purchases_documents_items created successfully');

      // Copiar datos de purchase_items si existen
      const [itemsCount] = await db.query('SELECT COUNT(*) as count FROM purchase_items');
      if (itemsCount[0].count > 0) {
        console.log(`Found ${itemsCount[0].count} items in purchase_items, copying...`);

        await db.query(`
          INSERT INTO purchases_documents_items (
            purchase_id, product_id, product_code, product_name,
            quantity, unit_price, discount_percentage, discount_amount,
            tax_percentage, tax_amount, subtotal, total, created_at, updated_at
          )
          SELECT
            purchase_id, product_id, product_code, product_name,
            quantity, unit_price,
            COALESCE(discount_percentage, 0),
            COALESCE(discount_amount, 0),
            COALESCE(tax_percentage, 0),
            COALESCE(tax_amount, 0),
            COALESCE(subtotal, quantity * unit_price),
            COALESCE(total, quantity * unit_price),
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
          FROM purchase_items
        `);

        console.log('✅ Data copied successfully');
      }
    } else {
      console.log('Creating purchases_documents_items table from scratch...');

      await db.query(`
        CREATE TABLE IF NOT EXISTS purchases_documents_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_id INT NOT NULL,
          product_id INT,
          product_code VARCHAR(100),
          product_name VARCHAR(255) NOT NULL,
          quantity DECIMAL(15,3) NOT NULL,
          unit_price DECIMAL(15,2) NOT NULL,
          discount_percentage DECIMAL(5,2) DEFAULT 0,
          discount_amount DECIMAL(15,2) DEFAULT 0,
          tax_percentage DECIMAL(5,2) DEFAULT 0,
          tax_amount DECIMAL(15,2) DEFAULT 0,
          subtotal DECIMAL(15,2) NOT NULL,
          total DECIMAL(15,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (purchase_id) REFERENCES purchases_documents(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('✅ Table created successfully');
    }

    // Verificar que la tabla se creó correctamente
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
        AND TABLE_NAME = 'purchases_documents_items'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\nTable structure:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createPurchasesDocumentsItemsTable();
