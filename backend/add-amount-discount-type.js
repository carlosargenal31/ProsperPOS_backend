require('dotenv').config();
const mysql = require('mysql2/promise');

async function addAmountDiscountType() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos'
    });

    console.log('✅ Conectado a la base de datos\n');

    // Add 'amount' to the discount_type ENUM in invoices table
    console.log('1️⃣ Actualizando ENUM discount_type en tabla invoices...');
    await connection.query(`
      ALTER TABLE invoices
      MODIFY COLUMN discount_type ENUM('percentage', 'fixed', 'amount') NULL
    `);
    console.log('✅ ENUM actualizado en tabla invoices\n');

    // Also update invoice_items if it has the column
    try {
      console.log('2️⃣ Verificando tabla invoice_items...');
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM invoice_items LIKE 'discount_type'
      `);

      if (columns.length > 0) {
        await connection.query(`
          ALTER TABLE invoice_items
          MODIFY COLUMN discount_type ENUM('percentage', 'fixed', 'amount') NULL
        `);
        console.log('✅ ENUM actualizado en tabla invoice_items\n');
      } else {
        console.log('ℹ️  Tabla invoice_items no tiene columna discount_type\n');
      }
    } catch (error) {
      console.log('ℹ️  No se pudo actualizar invoice_items:', error.message, '\n');
    }

    // Also update quotes table if it exists
    try {
      console.log('3️⃣ Verificando tabla quotes...');
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM quotes LIKE 'discount_type'
      `);

      if (columns.length > 0) {
        await connection.query(`
          ALTER TABLE quotes
          MODIFY COLUMN discount_type ENUM('percentage', 'fixed', 'amount', 'coupon') NULL
        `);
        console.log('✅ ENUM actualizado en tabla quotes\n');
      } else {
        console.log('ℹ️  Tabla quotes no tiene columna discount_type\n');
      }
    } catch (error) {
      console.log('ℹ️  No se pudo actualizar quotes:', error.message, '\n');
    }

    // Also update pending_invoices table if it exists
    try {
      console.log('4️⃣ Verificando tabla pending_invoices...');
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM pending_invoices LIKE 'discount_type'
      `);

      if (columns.length > 0) {
        await connection.query(`
          ALTER TABLE pending_invoices
          MODIFY COLUMN discount_type ENUM('percentage', 'fixed', 'amount', 'coupon') NULL
        `);
        console.log('✅ ENUM actualizado en tabla pending_invoices\n');
      } else {
        console.log('ℹ️  Tabla pending_invoices no tiene columna discount_type\n');
      }
    } catch (error) {
      console.log('ℹ️  No se pudo actualizar pending_invoices:', error.message, '\n');
    }

    console.log('✨ Migración completada exitosamente!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addAmountDiscountType();
