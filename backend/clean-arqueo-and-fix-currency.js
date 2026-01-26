const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prosperpos',
  port: process.env.DB_PORT || 3306
};

async function cleanArqueoAndFixCurrency() {
  let connection;

  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Conectado exitosamente\n');

    // Paso 1: Limpiar todas las sesiones de caja y datos relacionados
    console.log('=== LIMPIANDO MÓDULO DE ARQUEO ===\n');

    console.log('1. Eliminando denominaciones...');
    const [denomResult] = await connection.query('DELETE FROM cash_register_denominations');
    console.log(`   ✓ ${denomResult.affectedRows} denominaciones eliminadas`);

    console.log('2. Eliminando pagos bancarios...');
    const [paymentsResult] = await connection.query('DELETE FROM cash_register_bank_payments');
    console.log(`   ✓ ${paymentsResult.affectedRows} pagos bancarios eliminados`);

    console.log('3. Eliminando transacciones de caja...');
    const [transResult] = await connection.query('DELETE FROM cash_register_transactions');
    console.log(`   ✓ ${transResult.affectedRows} transacciones eliminadas`);

    console.log('4. Eliminando sesiones de caja...');
    const [sessionsResult] = await connection.query('DELETE FROM cash_register_sessions');
    console.log(`   ✓ ${sessionsResult.affectedRows} sesiones eliminadas\n`);

    // Paso 2: Verificar y corregir la estructura de la tabla para el manejo de moneda
    console.log('=== VERIFICANDO ESTRUCTURA DE MONEDA ===\n');

    // Verificar columna currency en cash_register_sessions
    console.log('1. Verificando columna currency en cash_register_sessions...');
    const [sessionsCols] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cash_register_sessions'
      AND COLUMN_NAME = 'currency'
    `, [dbConfig.database]);

    if (sessionsCols.length === 0) {
      console.log('   ⚠ Columna currency no existe, creándola...');
      await connection.query(`
        ALTER TABLE cash_register_sessions
        ADD COLUMN currency VARCHAR(20) DEFAULT 'LEMPIRA' AFTER final_total
      `);
      console.log('   ✓ Columna currency creada');
    } else {
      console.log('   ✓ Columna currency existe');
      console.log(`      Tipo: ${sessionsCols[0].COLUMN_TYPE}`);
      console.log(`      Default: ${sessionsCols[0].COLUMN_DEFAULT}`);
    }

    // Verificar columna exchange_rate en cash_register_sessions
    console.log('2. Verificando columna exchange_rate en cash_register_sessions...');
    const [exchangeCols] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cash_register_sessions'
      AND COLUMN_NAME = 'exchange_rate'
    `, [dbConfig.database]);

    if (exchangeCols.length === 0) {
      console.log('   ⚠ Columna exchange_rate no existe, creándola...');
      await connection.query(`
        ALTER TABLE cash_register_sessions
        ADD COLUMN exchange_rate DECIMAL(10, 4) DEFAULT 0.0000 AFTER currency
      `);
      console.log('   ✓ Columna exchange_rate creada');
    } else {
      console.log('   ✓ Columna exchange_rate existe');
      console.log(`      Tipo: ${exchangeCols[0].COLUMN_TYPE}`);
      console.log(`      Default: ${exchangeCols[0].COLUMN_DEFAULT}`);
    }

    // Verificar columna currency en cash_register_denominations
    console.log('3. Verificando columna currency en cash_register_denominations...');
    const [denomCols] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cash_register_denominations'
      AND COLUMN_NAME = 'currency'
    `, [dbConfig.database]);

    if (denomCols.length === 0) {
      console.log('   ⚠ Columna currency no existe, creándola...');
      await connection.query(`
        ALTER TABLE cash_register_denominations
        ADD COLUMN currency VARCHAR(20) DEFAULT 'LEMPIRA' AFTER denomination
      `);
      console.log('   ✓ Columna currency creada');
    } else {
      console.log('   ✓ Columna currency existe');
      console.log(`      Tipo: ${denomCols[0].COLUMN_TYPE}`);
      console.log(`      Default: ${denomCols[0].COLUMN_DEFAULT}`);
    }

    // Verificar columna currency en cash_register_bank_payments
    console.log('4. Verificando columna currency en cash_register_bank_payments...');
    const [bankPaymentsCols] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cash_register_bank_payments'
      AND COLUMN_NAME = 'currency'
    `, [dbConfig.database]);

    if (bankPaymentsCols.length === 0) {
      console.log('   ⚠ Columna currency no existe, creándola...');
      await connection.query(`
        ALTER TABLE cash_register_bank_payments
        ADD COLUMN currency VARCHAR(20) DEFAULT 'LEMPIRA' AFTER reference
      `);
      console.log('   ✓ Columna currency creada');
    } else {
      console.log('   ✓ Columna currency existe');
      console.log(`      Tipo: ${bankPaymentsCols[0].COLUMN_TYPE}`);
      console.log(`      Default: ${bankPaymentsCols[0].COLUMN_DEFAULT}`);
    }

    // Verificar columnas total_ext y total_local en cash_register_bank_payments
    console.log('5. Verificando columnas de monto en cash_register_bank_payments...');
    const [amountCols] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cash_register_bank_payments'
      AND COLUMN_NAME IN ('total_ext', 'total_local')
    `, [dbConfig.database]);

    const hasExternal = amountCols.some(col => col.COLUMN_NAME === 'total_ext');
    const hasLocal = amountCols.some(col => col.COLUMN_NAME === 'total_local');

    if (!hasExternal) {
      console.log('   ⚠ Columna total_ext no existe, creándola...');
      await connection.query(`
        ALTER TABLE cash_register_bank_payments
        ADD COLUMN total_ext DECIMAL(10, 2) DEFAULT 0.00 AFTER currency
      `);
      console.log('   ✓ Columna total_ext creada');
    }

    if (!hasLocal) {
      console.log('   ⚠ Columna total_local no existe, creándola...');
      await connection.query(`
        ALTER TABLE cash_register_bank_payments
        ADD COLUMN total_local DECIMAL(10, 2) DEFAULT 0.00 AFTER total_ext
      `);
      console.log('   ✓ Columna total_local creada');
    }

    if (hasExternal && hasLocal) {
      console.log('   ✓ Columnas de monto existen (total_ext, total_local)');
    }

    // Paso 3: Verificar estructura completa de las tablas
    console.log('\n=== ESTRUCTURA FINAL DE LAS TABLAS ===\n');

    console.log('Tabla: cash_register_sessions');
    const [sessionStructure] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cash_register_sessions'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);

    sessionStructure.forEach(col => {
      console.log(`   ${col.COLUMN_NAME} ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });

    console.log('\n✅ LIMPIEZA Y CORRECCIÓN COMPLETADA EXITOSAMENTE');
    console.log('\nAhora puedes:');
    console.log('1. Ir a http://localhost:3000/cash-register');
    console.log('2. Hacer clic en "Apertura de Caja"');
    console.log('3. Ingresar el monto de apertura');
    console.log('4. La sesión se creará correctamente');
    console.log('5. Luego podrás hacer el arqueo de caja sin problemas');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

// Ejecutar el script
cleanArqueoAndFixCurrency();
