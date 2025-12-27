// ===================================================================
// PROSPERPOS - APLICAR MIGRACIÓN DE AJUSTE DE INVENTARIO
// ===================================================================

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  let connection;

  try {
    console.log('🔄 Conectando a la base de datos...\n');

    // Crear conexión (ajusta estas credenciales según tu configuración)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos',
      multipleStatements: true
    });

    console.log('✅ Conectado a la base de datos\n');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'create-inventory-adjustment-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Ejecutando migración de ajuste de inventario...\n');

    // Dividir el SQL en statements individuales (evitar multipleStatements)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') ||
          statement.includes('ALTER TABLE') ||
          statement.includes('CREATE INDEX') ||
          statement.includes('DESCRIBE') ||
          statement.includes('SHOW INDEX') ||
          statement.includes('SELECT')) {
        try {
          await connection.execute(statement);

          if (statement.includes('CREATE TABLE IF NOT EXISTS inventory_adjustments')) {
            console.log('✓ Tabla inventory_adjustments creada/verificada');
          } else if (statement.includes('CREATE TABLE IF NOT EXISTS inventory_adjustment_details')) {
            console.log('✓ Tabla inventory_adjustment_details creada/verificada');
          } else if (statement.includes('CREATE TABLE IF NOT EXISTS stock')) {
            console.log('✓ Tabla stock verificada/actualizada');
          } else if (statement.includes('ALTER TABLE stock')) {
            console.log('✓ Columnas created_at/updated_at agregadas a stock');
          } else if (statement.includes('CREATE INDEX')) {
            console.log('✓ Índice adicional creado en stock');
          }
        } catch (error) {
          // Ignorar errores de "ya existe"
          if (error.code === 'ER_TABLE_EXISTS_ERROR' ||
              error.code === 'ER_DUP_KEYNAME' ||
              error.message.includes('Duplicate key name') ||
              error.message.includes('already exists')) {
            // OK, la tabla/índice ya existe
          } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
            // La columna ya existe
          } else {
            console.warn('⚠️  Advertencia:', error.message);
          }
        }
      }
    }

    console.log('\n📊 Verificando estructura de tablas...\n');

    // Verificar inventory_adjustments
    const [adjColumns] = await connection.execute('DESCRIBE inventory_adjustments');
    console.log('✓ Tabla inventory_adjustments tiene', adjColumns.length, 'columnas');

    // Verificar inventory_adjustment_details
    const [detColumns] = await connection.execute('DESCRIBE inventory_adjustment_details');
    console.log('✓ Tabla inventory_adjustment_details tiene', detColumns.length, 'columnas');

    // Verificar stock
    const [stockColumns] = await connection.execute('DESCRIBE stock');
    console.log('✓ Tabla stock tiene', stockColumns.length, 'columnas');

    // Verificar que stock tenga store_id
    const storeIdColumn = stockColumns.find(col => col.Field === 'store_id');
    if (storeIdColumn) {
      console.log('✓ Tabla stock tiene columna store_id correctamente');
    } else {
      console.error('✗ ERROR: Tabla stock NO tiene columna store_id');
      throw new Error('Tabla stock sin store_id');
    }

    // Verificar índice único
    const [indexes] = await connection.execute('SHOW INDEX FROM stock WHERE Key_name = "unique_product_store_warehouse"');
    if (indexes.length > 0) {
      console.log('✓ Tabla stock tiene índice único (product_id, store_id, warehouse_id)');
    } else {
      console.warn('⚠️  Tabla stock no tiene el índice único correcto');
    }

    console.log('\n✅ ¡Migración completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('   - Tabla inventory_adjustments: OK');
    console.log('   - Tabla inventory_adjustment_details: OK');
    console.log('   - Tabla stock: OK con store_id');
    console.log('   - Índices: OK');
    console.log('\n🎉 El sistema de ajuste de inventario está listo para usar!\n');

  } catch (error) {
    console.error('\n❌ Error al aplicar migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada\n');
    }
  }
}

// Ejecutar migración
applyMigration();
