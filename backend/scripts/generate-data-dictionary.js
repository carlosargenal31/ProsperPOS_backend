const mysql = require('mysql2/promise');
const fs = require('fs').promises;

async function generateDataDictionary() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  console.log('Conectado a la base de datos MySQL');

  // Obtener todas las tablas
  const [tables] = await connection.execute(`
    SELECT TABLE_NAME, TABLE_COMMENT, TABLE_TYPE
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'prosperpos'
    ORDER BY TABLE_NAME
  `);

  const databaseInfo = {
    tables: []
  };

  for (const table of tables) {
    const tableName = table.TABLE_NAME;
    const tableType = table.TABLE_TYPE;

    console.log(`Procesando: ${tableName} (${tableType})`);

    // Obtener columnas
    const [columns] = await connection.execute(`
      SELECT
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        COLUMN_DEFAULT,
        EXTRA,
        COLUMN_COMMENT,
        CHARACTER_MAXIMUM_LENGTH,
        NUMERIC_PRECISION,
        NUMERIC_SCALE,
        DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos' AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);

    // Obtener foreign keys
    const [foreignKeys] = await connection.execute(`
      SELECT
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'prosperpos'
        AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY ORDINAL_POSITION
    `, [tableName]);

    // Obtener índices
    const [indexes] = await connection.execute(`
      SELECT
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE,
        SEQ_IN_INDEX,
        INDEX_TYPE
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = 'prosperpos' AND TABLE_NAME = ?
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [tableName]);

    databaseInfo.tables.push({
      name: tableName,
      type: tableType,
      comment: table.TABLE_COMMENT,
      columns: columns,
      foreignKeys: foreignKeys,
      indexes: indexes
    });
  }

  await connection.end();

  // Guardar como JSON para procesamiento
  await fs.writeFile(
    'C:\\Users\\carlo\\OneDrive\\Escritorio\\ProsperPOS\\backend\\scripts\\db-structure.json',
    JSON.stringify(databaseInfo, null, 2)
  );

  console.log('Información extraída y guardada en db-structure.json');
  return databaseInfo;
}

generateDataDictionary().catch(console.error);
