const mysql = require('mysql2/promise');

async function addDiscountFieldsToOrders() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('Agregando campos de descuentos a tabla orders...\n');

    // Verificar si las columnas ya existen
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos'
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME IN ('coupon_code', 'coupon_name', 'coupon_discount', 'offers_discount', 'subtotal_before_discount', 'subtotal_after_discount', 'tax_amount')
    `);

    const existingColumns = columns.map(c => c.COLUMN_NAME);

    // Agregar coupon_code si no existe
    if (!existingColumns.includes('coupon_code')) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN coupon_code VARCHAR(50) NULL
        AFTER total_amount
      `);
      console.log('✓ Columna coupon_code agregada');
    } else {
      console.log('✓ Columna coupon_code ya existe');
    }

    // Agregar coupon_name si no existe
    if (!existingColumns.includes('coupon_name')) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN coupon_name VARCHAR(255) NULL
        AFTER coupon_code
      `);
      console.log('✓ Columna coupon_name agregada');
    } else {
      console.log('✓ Columna coupon_name ya existe');
    }

    // Agregar coupon_discount si no existe
    if (!existingColumns.includes('coupon_discount')) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN coupon_discount DECIMAL(10,2) NULL DEFAULT 0.00
        AFTER coupon_name
      `);
      console.log('✓ Columna coupon_discount agregada');
    } else {
      console.log('✓ Columna coupon_discount ya existe');
    }

    // Agregar offers_discount si no existe
    if (!existingColumns.includes('offers_discount')) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN offers_discount DECIMAL(10,2) NULL DEFAULT 0.00
        AFTER coupon_discount
      `);
      console.log('✓ Columna offers_discount agregada');
    } else {
      console.log('✓ Columna offers_discount ya existe');
    }

    // Agregar subtotal_before_discount si no existe
    if (!existingColumns.includes('subtotal_before_discount')) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN subtotal_before_discount DECIMAL(10,2) NULL DEFAULT 0.00
        AFTER offers_discount
      `);
      console.log('✓ Columna subtotal_before_discount agregada');
    } else {
      console.log('✓ Columna subtotal_before_discount ya existe');
    }

    // Agregar subtotal_after_discount si no existe
    if (!existingColumns.includes('subtotal_after_discount')) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN subtotal_after_discount DECIMAL(10,2) NULL DEFAULT 0.00
        AFTER subtotal_before_discount
      `);
      console.log('✓ Columna subtotal_after_discount agregada');
    } else {
      console.log('✓ Columna subtotal_after_discount ya existe');
    }

    // Agregar tax_amount si no existe
    if (!existingColumns.includes('tax_amount')) {
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN tax_amount DECIMAL(10,2) NULL DEFAULT 0.00
        AFTER subtotal_after_discount
      `);
      console.log('✓ Columna tax_amount agregada');
    } else {
      console.log('✓ Columna tax_amount ya existe');
    }

    console.log('\n¡Campos de descuentos agregados exitosamente!');

  } catch (error) {
    console.error('Error al agregar campos:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addDiscountFieldsToOrders();
