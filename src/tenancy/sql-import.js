// ===================================================================
// PROSPERPOS - IMPORTAR UN RESPALDO .sql (mysqldump) A UNA BASE NUEVA
// Se usa para traer empresas que ya tienen datos (ej. Cerámicas Universal).
// ===================================================================

/**
 * Divide un archivo de mysqldump en sentencias, respetando DELIMITER
 * (procedimientos y triggers), comentarios y cadenas.
 */
function splitSqlStatements(sql) {
  const statements = [];
  let delimiter = ';';
  let current = '';
  let inString = null;
  let i = 0;
  const len = sql.length;

  while (i < len) {
    // Cambios de delimitador al inicio de línea
    if (!inString && (i === 0 || sql[i - 1] === '\n') && /^DELIMITER\s/i.test(sql.slice(i, i + 10))) {
      const end = sql.indexOf('\n', i);
      const line = sql.slice(i, end === -1 ? len : end).trim();
      delimiter = line.split(/\s+/)[1] || ';';
      i = end === -1 ? len : end + 1;
      continue;
    }
    const ch = sql[i];

    if (inString) {
      current += ch;
      if (ch === '\\') { current += sql[i + 1] || ''; i += 2; continue; }
      if (ch === inString) inString = null;
      i += 1;
      continue;
    }

    // Comentarios de línea (-- o #), salvo dentro de cadenas
    if ((ch === '-' && sql[i + 1] === '-' && /\s/.test(sql[i + 2] || ' ')) || ch === '#') {
      const end = sql.indexOf('\n', i);
      i = end === -1 ? len : end + 1;
      continue;
    }
    // Comentarios de bloque normales (/* ... */) se omiten; los /*! ... */ se conservan
    if (ch === '/' && sql[i + 1] === '*' && sql[i + 2] !== '!') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? len : end + 2;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      inString = ch;
      current += ch;
      i += 1;
      continue;
    }

    if (sql.startsWith(delimiter, i)) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = '';
      i += delimiter.length;
      continue;
    }

    current += ch;
    i += 1;
  }
  const rest = current.trim();
  if (rest) statements.push(rest);
  return statements;
}

/** Limpia lo que no se puede ejecutar en un servidor administrado */
function sanitizeStatement(stmt) {
  return stmt
    // DEFINER=`root`@`localhost` → sin definer (usa el usuario actual)
    .replace(/\/\*!50013 DEFINER=`[^`]*`@`[^`]*` SQL SECURITY DEFINER \*\//g, '')
    .replace(/DEFINER\s*=\s*`[^`]*`@`[^`]*`\s*/gi, '')
    .replace(/DEFINER\s*=\s*[^\s]+@[^\s]+\s*/gi, '');
}

function shouldSkip(stmt) {
  const s = stmt.replace(/^\/\*![0-9]+\s*/, '').trim().toUpperCase();
  return (
    s.startsWith('SET @@GLOBAL.GTID_PURGED') ||
    s.startsWith('SET @@SESSION.SQL_LOG_BIN') ||
    s.startsWith('CREATE DATABASE') ||
    s.startsWith('USE ')
  );
}

/**
 * Importa el contenido SQL en la conexión dada (ya conectada a la base destino).
 * @returns {Promise<{executed: number}>}
 */
async function importSql(conn, sqlText) {
  const statements = splitSqlStatements(sqlText);
  let executed = 0;
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('SET UNIQUE_CHECKS = 0');
  for (const raw of statements) {
    if (shouldSkip(raw)) continue;
    const stmt = sanitizeStatement(raw);
    try {
      await conn.query(stmt);
      executed += 1;
    } catch (error) {
      error.message = `${error.message} — en: ${stmt.slice(0, 160)}`;
      throw error;
    }
  }
  await conn.query('SET UNIQUE_CHECKS = 1');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  return { executed };
}

module.exports = { splitSqlStatements, sanitizeStatement, importSql };
