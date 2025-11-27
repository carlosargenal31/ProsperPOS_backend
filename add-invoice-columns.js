const db = require('./src/utils/database');

const columns = [
  { name: 'commercial_name', type: 'VARCHAR(255)', after: 'company_name' },
  { name: 'id_type', type: 'VARCHAR(50)', after: 'commercial_name' },
  { name: 'sar', type: 'VARCHAR(255)', after: 'id_type' },
  { name: 'taxpayer_type', type: 'VARCHAR(50)', after: 'sar' },
  { name: 'beneficiary_type', type: 'VARCHAR(50)', after: 'taxpayer_type' },
  { name: 'representative', type: 'VARCHAR(255)', after: 'beneficiary_type' },
  { name: 'global_location', type: 'VARCHAR(255)', after: 'representative' },
  { name: 'facebook', type: 'VARCHAR(255)', after: 'global_location' },
  { name: 'instagram', type: 'VARCHAR(255)', after: 'facebook' },
  { name: 'twitter', type: 'VARCHAR(255)', after: 'instagram' },
  { name: 'whatsapp', type: 'VARCHAR(20)', after: 'twitter' },
  { name: 'country', type: 'VARCHAR(100)', after: 'whatsapp' },
  { name: 'state', type: 'VARCHAR(100)', after: 'country' },
  { name: 'city', type: 'VARCHAR(100)', after: 'state' },
  { name: 'sector', type: 'VARCHAR(100)', after: 'city' },
  { name: 'period_from', type: 'DATE', after: 'sector' },
  { name: 'period_to', type: 'DATE', after: 'period_from' },
  { name: 'language', type: 'VARCHAR(10) DEFAULT "es"', after: 'period_to' },
  { name: 'postal_code', type: 'VARCHAR(20)', after: 'language' },
  { name: 'logo_width', type: 'INT DEFAULT 150', after: 'postal_code' },
  { name: 'company_logo_path', type: 'VARCHAR(500)', after: 'logo_width' }
];

async function addColumns() {
  try {
    console.log('Adding columns to billing_settings table...\n');

    for (const column of columns) {
      try {
        // Check if column exists
        const checkQuery = `
          SELECT COUNT(*) as count
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = 'prosperpos'
          AND TABLE_NAME = 'billing_settings'
          AND COLUMN_NAME = ?
        `;

        const result = await db.query(checkQuery, [column.name]);

        if (result[0].count === 0) {
          // Column doesn't exist, add it
          const alterQuery = `ALTER TABLE billing_settings ADD COLUMN ${column.name} ${column.type} AFTER ${column.after}`;
          await db.query(alterQuery);
          console.log(`✓ Added column: ${column.name}`);
        } else {
          console.log(`⊘ Column already exists: ${column.name}`);
        }
      } catch (err) {
        console.error(`✗ Error adding column ${column.name}:`, err.message);
      }
    }

    console.log('\n✓ Column addition completed!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

addColumns();
