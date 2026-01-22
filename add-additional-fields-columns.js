const mysql = require('mysql2/promise');
require('dotenv').config();

async function addAdditionalFieldsColumns() {
  let connection;

  try {
    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosper_pos'
    });

    console.log('✓ Conectado a MySQL');

    // Verificar y agregar columnas a la tabla invoices
    console.log('\n=== TABLA INVOICES ===');

    const [invoicesColumns] = await connection.query('DESCRIBE invoices');
    const invoicesHasOrdenCompra = invoicesColumns.some(col => col.Field === 'orden_compra');
    const invoicesHasConstancia = invoicesColumns.some(col => col.Field === 'constancia_exonerado');
    const invoicesHasRegistroSag = invoicesColumns.some(col => col.Field === 'registro_sag');

    if (!invoicesHasOrdenCompra) {
      console.log('Agregando columna orden_compra a invoices...');
      await connection.query(`
        ALTER TABLE invoices
        ADD COLUMN orden_compra VARCHAR(100) NULL AFTER resolution_number
      `);
      console.log('✓ Columna orden_compra agregada');
    } else {
      console.log('✓ Columna orden_compra ya existe');
    }

    if (!invoicesHasConstancia) {
      console.log('Agregando columna constancia_exonerado a invoices...');
      await connection.query(`
        ALTER TABLE invoices
        ADD COLUMN constancia_exonerado VARCHAR(100) NULL AFTER orden_compra
      `);
      console.log('✓ Columna constancia_exonerado agregada');
    } else {
      console.log('✓ Columna constancia_exonerado ya existe');
    }

    if (!invoicesHasRegistroSag) {
      console.log('Agregando columna registro_sag a invoices...');
      await connection.query(`
        ALTER TABLE invoices
        ADD COLUMN registro_sag VARCHAR(100) NULL AFTER constancia_exonerado
      `);
      console.log('✓ Columna registro_sag agregada');
    } else {
      console.log('✓ Columna registro_sag ya existe');
    }

    // Verificar y agregar columnas a la tabla quotes
    console.log('\n=== TABLA QUOTES ===');

    const [quotesColumns] = await connection.query('DESCRIBE quotes');
    const quotesHasOrdenCompra = quotesColumns.some(col => col.Field === 'orden_compra');
    const quotesHasConstancia = quotesColumns.some(col => col.Field === 'constancia_exonerado');
    const quotesHasRegistroSag = quotesColumns.some(col => col.Field === 'registro_sag');

    if (!quotesHasOrdenCompra) {
      console.log('Agregando columna orden_compra a quotes...');
      await connection.query(`
        ALTER TABLE quotes
        ADD COLUMN orden_compra VARCHAR(100) NULL
      `);
      console.log('✓ Columna orden_compra agregada');
    } else {
      console.log('✓ Columna orden_compra ya existe');
    }

    if (!quotesHasConstancia) {
      console.log('Agregando columna constancia_exonerado a quotes...');
      await connection.query(`
        ALTER TABLE quotes
        ADD COLUMN constancia_exonerado VARCHAR(100) NULL
      `);
      console.log('✓ Columna constancia_exonerado agregada');
    } else {
      console.log('✓ Columna constancia_exonerado ya existe');
    }

    if (!quotesHasRegistroSag) {
      console.log('Agregando columna registro_sag a quotes...');
      await connection.query(`
        ALTER TABLE quotes
        ADD COLUMN registro_sag VARCHAR(100) NULL
      `);
      console.log('✓ Columna registro_sag agregada');
    } else {
      console.log('✓ Columna registro_sag ya existe');
    }

    // Verificar y agregar columnas a la tabla pending_invoices
    console.log('\n=== TABLA PENDING_INVOICES ===');

    const [pendingColumns] = await connection.query('DESCRIBE pending_invoices');
    const pendingHasOrdenCompra = pendingColumns.some(col => col.Field === 'orden_compra');
    const pendingHasConstancia = pendingColumns.some(col => col.Field === 'constancia_exonerado');
    const pendingHasRegistroSag = pendingColumns.some(col => col.Field === 'registro_sag');

    if (!pendingHasOrdenCompra) {
      console.log('Agregando columna orden_compra a pending_invoices...');
      await connection.query(`
        ALTER TABLE pending_invoices
        ADD COLUMN orden_compra VARCHAR(100) NULL
      `);
      console.log('✓ Columna orden_compra agregada');
    } else {
      console.log('✓ Columna orden_compra ya existe');
    }

    if (!pendingHasConstancia) {
      console.log('Agregando columna constancia_exonerado a pending_invoices...');
      await connection.query(`
        ALTER TABLE pending_invoices
        ADD COLUMN constancia_exonerado VARCHAR(100) NULL
      `);
      console.log('✓ Columna constancia_exonerado agregada');
    } else {
      console.log('✓ Columna constancia_exonerado ya existe');
    }

    if (!pendingHasRegistroSag) {
      console.log('Agregando columna registro_sag a pending_invoices...');
      await connection.query(`
        ALTER TABLE pending_invoices
        ADD COLUMN registro_sag VARCHAR(100) NULL
      `);
      console.log('✓ Columna registro_sag agregada');
    } else {
      console.log('✓ Columna registro_sag ya existe');
    }

    console.log('\n✅ COMPLETADO - Todas las columnas han sido verificadas/agregadas');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
addAdditionalFieldsColumns()
  .then(() => {
    console.log('\n✓ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error ejecutando el script:', error);
    process.exit(1);
  });
