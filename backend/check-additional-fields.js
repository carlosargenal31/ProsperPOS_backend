require('dotenv').config();
const db = require('./src/utils/database');

(async () => {
  try {
    const cols = await db.query('DESCRIBE products');
    const hasField = cols.find(c => c.Field === 'additional_fields');
    console.log('additional_fields column exists:', !!hasField);

    if (!hasField) {
      console.log('Column NOT found in products table');
      console.log('Available columns:', cols.map(c => c.Field).join(', '));
    } else {
      console.log('Column details:', hasField);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
