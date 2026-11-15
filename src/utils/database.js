// ===================================================================
// PROSPERPOS - CONFIGURACIÓN DE BASE DE DATOS MYSQL (CORREGIDA)
// ===================================================================

const mysql = require('mysql2/promise');
const logger = require('./logger');
const { getCurrentDatabase } = require('../tenancy/context');

// ===================================================================
// CONFIGURACIÓN DE CONEXIÓN
// ===================================================================

// En Railway se puede usar una sola variable DATABASE_URL / MYSQL_URL
// (mysql://usuario:clave@host:puerto/base). Si no existe, se usan DB_*.
function parseDatabaseUrl() {
  const raw = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (!raw) return {};
  try {
    const url = new URL(raw);
    return {
      host: url.hostname,
      port: url.port || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, '')
    };
  } catch (error) {
    return {};
  }
}

const urlConfig = parseDatabaseUrl();

const dbConfig = {
  host: urlConfig.host || process.env.DB_HOST || 'localhost',
  port: urlConfig.port || process.env.DB_PORT || 3306,
  user: urlConfig.user || process.env.DB_USER || 'root',
  password: urlConfig.password !== undefined ? urlConfig.password : (process.env.DB_PASSWORD || ''),
  database: urlConfig.database || process.env.DB_NAME || 'prosperpos',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Configuración crítica para caracteres especiales
  typeCast: function (field, next) {
    if (field.type === 'VAR_STRING' || field.type === 'STRING' || field.type === 'VARCHAR') {
      return field.string();
    }
    return next();
  }
};

// ===================================================================
// POOL DE CONEXIONES
// ===================================================================

// Un pool por base de datos (una base de datos por empresa en modo multi-empresa)
const pools = new Map();

function currentDatabase() {
  return getCurrentDatabase(dbConfig.database);
}

function getPool(database = currentDatabase()) {
  let pool = pools.get(database);
  if (!pool) {
    const isDefault = database === dbConfig.database;
    pool = mysql.createPool({
      ...dbConfig,
      database,
      // Las empresas comparten el servidor MySQL: pools pequeños por empresa
      connectionLimit: isDefault ? dbConfig.connectionLimit : (parseInt(process.env.TENANT_DB_CONNECTION_LIMIT) || 5)
    });
    pools.set(database, pool);
  }
  return pool;
}

// ===================================================================
// FUNCIONES DE CONEXIÓN
// ===================================================================

/**
 * Inicializar pool de conexiones
 */
async function connectDatabase() {
  try {
    const database = currentDatabase();
    const exists = pools.has(database);
    const pool = getPool(database);
    if (exists) {
      return pool;
    }

    // Verificar conexión y configurar UTF-8
    const connection = await pool.getConnection();
    await connection.query("SET NAMES 'utf8mb4'");
    await connection.query("SET CHARACTER SET utf8mb4");
    await connection.query("SET character_set_results = 'utf8mb4'");
    await connection.ping();
    connection.release();

    logger.info('Pool de conexiones MySQL creado exitosamente');
    logger.info(`Base de datos: ${database}`);
    logger.info(`Host: ${dbConfig.host}:${dbConfig.port}`);
    
    return pool;
  } catch (error) {
    logger.error('Error conectando a MySQL:', error.message);
    throw error;
  }
}

/**
 * Obtener conexión del pool
 */
async function getConnection() {
  try {
    return await getPool().getConnection();
  } catch (error) {
    logger.error('Error obteniendo conexión:', error.message);
    throw error;
  }
}

/**
 * Cerrar pool de conexiones
 */
async function closeDatabase() {
  try {
    for (const [name, pool] of pools) {
      await pool.end();
      pools.delete(name);
    }
    logger.info('Pools de conexiones cerrados');
  } catch (error) {
    logger.error('Error cerrando pool:', error.message);
    throw error;
  }
}

// ===================================================================
// FUNCIONES DE CONSULTA
// ===================================================================

/**
 * Ejecutar consulta SQL
 */
async function query(sql, params = []) {
  let connection = null;

  try {
    connection = await getConnection();

    // Asegurar que params sea siempre un array
    const paramsArray = Array.isArray(params) ? params : [];

    if (process.env.LOG_SQL === 'true') {
      logger.debug('SQL:', sql);
      logger.debug('Params:', paramsArray);
    }

    const [results] = await connection.query(sql, paramsArray);

    return results;
  } catch (error) {
    logger.error('Error en consulta SQL:', error.message);
    logger.error('SQL:', sql);
    logger.error('Params:', params);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Ejecutar consulta SQL (alias para compatibilidad)
 */
async function execute(sql, params = []) {
  return await query(sql, params);
}

/**
 * Ejecutar transacción
 */
async function transaction(queries) {
  let connection = null;
  
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const results = [];
    
    for (const { sql, params = [] } of queries) {
      if (process.env.LOG_SQL === 'true') {
        logger.debug('Transaction SQL:', sql);
        logger.debug('Params:', params);
      }
      
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }

    await connection.commit();
    logger.info('Transacción completada exitosamente');
    
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
      logger.error('Transacción revertida');
    }
    
    logger.error('Error en transacción:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Ejecutar procedimiento almacenado
 */
async function callProcedure(procedureName, params = []) {
  try {
    const placeholders = params.map(() => '?').join(', ');
    const sql = `CALL ${procedureName}(${placeholders})`;
    
    return await query(sql, params);
  } catch (error) {
    logger.error(`Error ejecutando procedimiento ${procedureName}:`, error.message);
    throw error;
  }
}

/**
 * Verificar si tabla existe
 */
async function tableExists(tableName) {
  try {
    const sql = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `;
    
    const result = await query(sql, [currentDatabase(), tableName]);
    return result[0].count > 0;
  } catch (error) {
    logger.error(`Error verificando tabla ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Obtener estructura de tabla
 */
async function getTableStructure(tableName) {
  try {
    const sql = `DESCRIBE ${tableName}`;
    return await query(sql);
  } catch (error) {
    logger.error(`Error obteniendo estructura de ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Obtener estadísticas de la base de datos
 */
async function getDatabaseStats() {
  try {
    const stats = {
      tables: [],
      totalRecords: 0,
      size: '0 MB'
    };

    // Obtener lista de tablas
    const tablesResult = await query(`
      SELECT table_name, table_rows 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [currentDatabase()]);

    stats.tables = tablesResult;
    stats.totalRecords = tablesResult.reduce((sum, table) => sum + (table.table_rows || 0), 0);

    // Obtener tamaño de la base de datos
    const sizeResult = await query(`
      SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [currentDatabase()]);

    stats.size = `${sizeResult[0].size_mb || 0} MB`;

    return stats;
  } catch (error) {
    logger.error('Error obteniendo estadísticas de BD:', error.message);
    throw error;
  }
}

/**
 * Probar conexión a la base de datos
 */
async function testConnection() {
  try {
    return await connectDatabase();
  } catch (error) {
    throw error;
  }
}

// ===================================================================
// EVENTOS DEL POOL
// ===================================================================

process.on('SIGINT', async () => {
  await closeDatabase();
});

process.on('SIGTERM', async () => {
  await closeDatabase();
});

// ===================================================================
// EXPORTAR FUNCIONES (CORREGIDAS)
// ===================================================================

module.exports = {
  connectDatabase,
  testConnection,
  getConnection,
  closeDatabase,
  query,
  execute, // Agregar función execute para compatibilidad
  transaction,
  callProcedure,
  tableExists,
  getTableStructure,
  getDatabaseStats,
  pool: () => getPool(),
  getPool,
  currentDatabase,
  dbConfig
};