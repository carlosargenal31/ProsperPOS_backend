const db = require('./src/utils/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('='.repeat(60));
    console.log('  BILLING MODULE MIGRATION');
    console.log('='.repeat(60));

    const migrationPath = path.join(__dirname, 'database', 'migrations', '011_create_billing_tables_simple.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('\nRunning billing migration...\n');

    // Split by delimiter and filter empty statements
    const statements = sql
      .split('DELIMITER ;')
      .join('')
      .split('DELIMITER //')
      .join('')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      try {
        await db.query(statement);
        successCount++;

        // Log progress for important operations
        if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i);
          if (match) {
            console.log(`  ✓ Created table: ${match[1]}`);
          }
        } else if (statement.includes('INSERT INTO permissions')) {
          console.log(`  ✓ Created billing permissions`);
        } else if (statement.includes('CREATE OR REPLACE VIEW')) {
          const match = statement.match(/CREATE OR REPLACE VIEW `?(\w+)`?/i);
          if (match) {
            console.log(`  ✓ Created view: ${match[1]}`);
          }
        } else if (statement.includes('CREATE TRIGGER')) {
          const match = statement.match(/CREATE TRIGGER (?:IF NOT EXISTS )?`?(\w+)`?/i);
          if (match) {
            console.log(`  ✓ Created trigger: ${match[1]}`);
          }
        }
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('Duplicate')) {
          skipCount++;
          // Silently skip existing objects
        } else {
          errorCount++;
          console.error(`  ✗ Error in statement ${i + 1}:`, err.message.substring(0, 100));
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('  MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`  ✓ Successfully executed: ${successCount} statements`);
    if (skipCount > 0) {
      console.log(`  ⊘ Skipped (already exists): ${skipCount} statements`);
    }
    if (errorCount > 0) {
      console.log(`  ✗ Errors: ${errorCount} statements`);
    }
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n✓ Billing module migration completed successfully!\n');
    } else {
      console.log('\n⚠ Migration completed with some errors. Please check above.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
runMigration();
