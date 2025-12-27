// ===================================================================
// SCRIPT DE PRUEBA DE CONEXIÓN A GOOGLE CLOUD SQL
// ===================================================================

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST DE CONEXIÓN A GOOGLE CLOUD SQL                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Verificar variables de entorno
  console.log('📋 Configuración:');
  console.log(`   Host: ${process.env.DB_HOST || 'NO CONFIGURADO'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'NO CONFIGURADO'}`);
  console.log(`   User: ${process.env.DB_USER || 'NO CONFIGURADO'}`);
  console.log(`   Port: ${process.env.DB_PORT || '3306'}`);
  console.log('\n');

  if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('❌ Error: Faltan variables de entorno requeridas');
    console.error('   Asegúrate de configurar DB_HOST, DB_NAME, DB_USER y DB_PASSWORD\n');
    process.exit(1);
  }

  let connection;

  try {
    console.log('🔄 Intentando conectar a Cloud SQL...\n');

    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      connectTimeout: 10000
    });

    console.log('✅ Conexión establecida exitosamente!\n');

    // Test 1: Verificar versión de MySQL
    console.log('📊 Test 1: Versión de MySQL');
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log(`   Versión: ${versionRows[0].version}`);
    console.log('   ✓ Test exitoso\n');

    // Test 2: Verificar base de datos actual
    console.log('📊 Test 2: Base de datos actual');
    const [dbRows] = await connection.execute('SELECT DATABASE() as current_db');
    console.log(`   Base de datos: ${dbRows[0].current_db}`);
    console.log('   ✓ Test exitoso\n');

    // Test 3: Listar tablas
    console.log('📊 Test 3: Tablas disponibles');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`   Total de tablas: ${tables.length}`);
    if (tables.length > 0) {
      console.log('   Primeras 10 tablas:');
      tables.slice(0, 10).forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    }
    console.log('   ✓ Test exitoso\n');

    // Test 4: Contar productos
    console.log('📊 Test 4: Verificar tabla products');
    try {
      const [productCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL'
      );
      console.log(`   Total de productos activos: ${productCount[0].count}`);
      console.log('   ✓ Test exitoso\n');
    } catch (error) {
      console.log('   ⚠️  Tabla products no existe o no tiene datos\n');
    }

    // Test 5: Verificar latencia
    console.log('📊 Test 5: Test de latencia');
    const start = Date.now();
    await connection.execute('SELECT 1');
    const latency = Date.now() - start;
    console.log(`   Latencia: ${latency}ms`);
    if (latency < 50) {
      console.log('   ✓ Excelente latencia\n');
    } else if (latency < 100) {
      console.log('   ✓ Buena latencia\n');
    } else if (latency < 200) {
      console.log('   ⚠️  Latencia aceptable\n');
    } else {
      console.log('   ⚠️  Latencia alta - considera cambiar región\n');
    }

    // Test 6: Verificar configuración
    console.log('📊 Test 6: Configuración del servidor');
    const [config] = await connection.execute(`
      SHOW VARIABLES WHERE Variable_name IN (
        'max_connections',
        'character_set_server',
        'collation_server',
        'time_zone'
      )
    `);
    config.forEach(row => {
      console.log(`   ${row.Variable_name}: ${row.Value}`);
    });
    console.log('   ✓ Test exitoso\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TODOS LOS TESTS COMPLETADOS EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error al conectar a Cloud SQL:\n');
    console.error(`   Código: ${error.code}`);
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Posibles soluciones:\n');

    if (error.code === 'ECONNREFUSED') {
      console.error('   1. Verifica que la IP de Cloud SQL sea correcta');
      console.error('   2. Asegúrate de que tu IP está autorizada en Cloud SQL');
      console.error('   3. Verifica que Cloud SQL esté en ejecución\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   1. Verifica el usuario y contraseña');
      console.error('   2. Asegúrate de que el usuario tiene permisos\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   1. Verifica tu conexión a internet');
      console.error('   2. Revisa firewall y reglas de red');
      console.error('   3. Considera usar Cloud SQL Proxy\n');
    } else {
      console.error('   1. Revisa la documentación de Google Cloud SQL');
      console.error('   2. Verifica los logs en Google Cloud Console\n');
    }

    process.exit(1);

  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada\n');
    }
  }
}

// Ejecutar test
testConnection();
