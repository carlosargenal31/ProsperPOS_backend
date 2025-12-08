const fs = require('fs').promises;

// Categorización de tablas por módulos
const moduleCategories = {
  'Seguridad y Autenticación': [
    'users', 'roles', 'permissions', 'user_roles', 'role_permissions',
    'user_sessions', 'login_attempts', 'password_resets', 'password_reset_tokens',
    'refresh_tokens', 'v_active_sessions'
  ],
  'Recursos Humanos': [
    'hr_employees', 'hr_departments', 'hr_positions',
    'vw_employees_full', 'vw_department_summary', 'vw_position_summary'
  ],
  'Productos e Inventario': [
    'products', 'categories', 'subcategories', 'brands', 'units',
    'product_prices', 'stock', 'stock_movements', 'v_stock_movements_summary',
    'warehouses', 'stores'
  ],
  'Clientes y Proveedores': [
    'customers', 'suppliers', 'beneficiary_types'
  ],
  'Ventas': [
    'sales', 'sale_items', 'sales_returns', 'sales_return_items',
    'quotes', 'quote_items'
  ],
  'Compras': [
    'purchases', 'purchase_items', 'purchases_returns', 'purchases_returns_items',
    'purchases_documents', 'purchases_documents_items'
  ],
  'Facturación': [
    'invoices', 'invoice_items', 'invoice_payments',
    'pending_invoices', 'pending_invoice_items',
    'credit_notes', 'credit_note_items',
    'resolutions', 'billing_settings'
  ],
  'Envíos': [
    'shipments', 'shipment_items', 'vehicles'
  ],
  'Promociones y Ofertas': [
    'coupons', 'coupon_products'
  ],
  'Pagos y Finanzas': [
    'payment_methods', 'bank_accounts', 'currencies', 'tax_rates'
  ],
  'Configuración General': [
    'branches', 'countries', 'states', 'cities'
  ]
};

// Descripciones de tablas
const tableDescriptions = {
  // Seguridad
  'users': 'Almacena la información de los usuarios del sistema',
  'roles': 'Define los roles disponibles en el sistema',
  'permissions': 'Lista de permisos específicos que pueden asignarse a roles',
  'user_roles': 'Relación muchos a muchos entre usuarios y roles',
  'role_permissions': 'Relación muchos a muchos entre roles y permisos',
  'user_sessions': 'Registro de sesiones activas de usuarios',
  'login_attempts': 'Registro de intentos de inicio de sesión (exitosos y fallidos)',
  'password_resets': 'Solicitudes de restablecimiento de contraseña',
  'password_reset_tokens': 'Tokens de verificación para reseteo de contraseña',
  'refresh_tokens': 'Tokens de actualización para autenticación JWT',
  'v_active_sessions': 'Vista de sesiones activas con información de usuario',

  // Recursos Humanos
  'hr_employees': 'Información de empleados de la empresa',
  'hr_departments': 'Departamentos organizacionales de la empresa',
  'hr_positions': 'Puestos o cargos laborales disponibles',
  'vw_employees_full': 'Vista completa de empleados con departamento y puesto',
  'vw_department_summary': 'Vista resumen de departamentos con cantidad de empleados',
  'vw_position_summary': 'Vista resumen de puestos con cantidad de empleados',

  // Productos
  'products': 'Catálogo de productos disponibles para venta',
  'categories': 'Categorías principales de productos',
  'subcategories': 'Subcategorías de productos',
  'brands': 'Marcas de productos',
  'units': 'Unidades de medida (piezas, kg, litros, etc.)',
  'product_prices': 'Historial de precios de productos',
  'stock': 'Inventario actual de productos por ubicación',
  'stock_movements': 'Registro de movimientos de inventario',
  'v_stock_movements_summary': 'Vista resumen de movimientos de stock',
  'warehouses': 'Almacenes o bodegas de la empresa',
  'stores': 'Tiendas o puntos de venta',

  // Clientes y Proveedores
  'customers': 'Base de datos de clientes',
  'suppliers': 'Proveedores de productos',
  'beneficiary_types': 'Tipos de beneficiarios (clientes, proveedores, empleados)',

  // Ventas
  'sales': 'Registro de ventas realizadas',
  'sale_items': 'Detalles de productos vendidos en cada venta',
  'sales_returns': 'Devoluciones de ventas',
  'sales_return_items': 'Detalles de productos devueltos',
  'quotes': 'Cotizaciones generadas para clientes',
  'quote_items': 'Detalles de productos en cotizaciones',

  // Compras
  'purchases': 'Registro de compras a proveedores',
  'purchase_items': 'Detalles de productos comprados',
  'purchases_returns': 'Devoluciones de compras a proveedores',
  'purchases_returns_items': 'Detalles de productos devueltos a proveedores',
  'purchases_documents': 'Documentos relacionados con compras',
  'purchases_documents_items': 'Ítems de documentos de compras',

  // Facturación
  'invoices': 'Facturas emitidas',
  'invoice_items': 'Detalles de productos en facturas',
  'invoice_payments': 'Pagos recibidos por facturas',
  'pending_invoices': 'Facturas pendientes de emisión',
  'pending_invoice_items': 'Detalles de facturas pendientes',
  'credit_notes': 'Notas de crédito emitidas',
  'credit_note_items': 'Detalles de notas de crédito',
  'resolutions': 'Resoluciones de facturación autorizadas por entidad tributaria',
  'billing_settings': 'Configuración general de facturación',

  // Envíos
  'shipments': 'Registro de envíos realizados',
  'shipment_items': 'Detalles de productos en cada envío',
  'vehicles': 'Vehículos utilizados para envíos',

  // Promociones
  'coupons': 'Cupones de descuento y promociones',
  'coupon_products': 'Productos aplicables a cada cupón',

  // Pagos y Finanzas
  'payment_methods': 'Métodos de pago disponibles (efectivo, tarjeta, transferencia)',
  'bank_accounts': 'Cuentas bancarias de la empresa',
  'currencies': 'Monedas soportadas por el sistema',
  'tax_rates': 'Tasas de impuestos aplicables',

  // Configuración
  'branches': 'Sucursales de la empresa',
  'countries': 'Países',
  'states': 'Estados o departamentos',
  'cities': 'Ciudades'
};

function getColumnDescription(tableName, columnName) {
  // Descripciones comunes
  const commonDescriptions = {
    'id': 'Identificador único autoincremental',
    'created_at': 'Fecha y hora de creación del registro',
    'updated_at': 'Fecha y hora de última actualización',
    'deleted_at': 'Fecha y hora de eliminación lógica (soft delete)',
    'is_active': 'Estado activo/inactivo del registro',
    'status': 'Estado actual del registro',
    'name': 'Nombre descriptivo',
    'code': 'Código único',
    'description': 'Descripción detallada',
    'notes': 'Notas o comentarios adicionales',
    'user_id': 'Referencia al usuario',
    'created_by': 'Usuario que creó el registro',
    'updated_by': 'Usuario que actualizó el registro'
  };

  if (commonDescriptions[columnName]) {
    return commonDescriptions[columnName];
  }

  // Descripciones específicas por patrón
  if (columnName.endsWith('_id') && columnName !== 'id') {
    const refTable = columnName.replace('_id', '');
    return `Referencia a la tabla ${refTable}`;
  }

  if (columnName.startsWith('is_')) {
    return `Indica si ${columnName.replace('is_', '').replace(/_/g, ' ')}`;
  }

  if (columnName.includes('date')) {
    return `Fecha de ${columnName.replace('_date', '').replace(/_/g, ' ')}`;
  }

  if (columnName.includes('amount') || columnName.includes('total') || columnName.includes('price')) {
    return `Monto en unidades monetarias`;
  }

  return 'Campo de datos';
}

function formatDataType(column) {
  const type = column.COLUMN_TYPE;
  let formatted = type;

  if (column.CHARACTER_MAXIMUM_LENGTH) {
    formatted = `${column.DATA_TYPE}(${column.CHARACTER_MAXIMUM_LENGTH})`;
  } else if (column.NUMERIC_PRECISION) {
    if (column.NUMERIC_SCALE) {
      formatted = `${column.DATA_TYPE}(${column.NUMERIC_PRECISION},${column.NUMERIC_SCALE})`;
    } else {
      formatted = `${column.DATA_TYPE}(${column.NUMERIC_PRECISION})`;
    }
  }

  return formatted.toUpperCase();
}

function groupIndexesByName(indexes) {
  const grouped = {};
  for (const idx of indexes) {
    if (!grouped[idx.INDEX_NAME]) {
      grouped[idx.INDEX_NAME] = {
        name: idx.INDEX_NAME,
        unique: idx.NON_UNIQUE === 0,
        type: idx.INDEX_TYPE,
        columns: []
      };
    }
    grouped[idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
  }
  return Object.values(grouped);
}

async function createMarkdownDictionary() {
  // Leer el JSON generado
  const data = await fs.readFile(
    'C:\\Users\\carlo\\OneDrive\\Escritorio\\ProsperPOS\\backend\\scripts\\db-structure.json',
    'utf8'
  );

  const dbInfo = JSON.parse(data);

  let markdown = `# Diccionario de Datos - Sistema ProsperPOS

---

## Información General

**Base de Datos:** prosperpos
**Sistema Gestor:** MySQL
**Fecha de Generación:** ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
**Total de Tablas:** ${dbInfo.tables.filter(t => t.type === 'BASE TABLE').length}
**Total de Vistas:** ${dbInfo.tables.filter(t => t.type === 'VIEW').length}

---

## Índice de Contenidos

`;

  // Generar índice
  for (const [moduleName, tables] of Object.entries(moduleCategories)) {
    markdown += `- [${moduleName}](#${moduleName.toLowerCase().replace(/\s+/g, '-').replace(/ó/g, 'o').replace(/í/g, 'i').replace(/ñ/g, 'n')})\n`;
  }

  markdown += `\n---\n\n`;

  // Generar contenido por módulo
  for (const [moduleName, tableNames] of Object.entries(moduleCategories)) {
    markdown += `## ${moduleName}\n\n`;

    const moduleTables = dbInfo.tables.filter(t => tableNames.includes(t.name));

    if (moduleTables.length === 0) {
      markdown += `*No hay tablas en este módulo*\n\n`;
      continue;
    }

    for (const table of moduleTables) {
      const tableType = table.type === 'VIEW' ? 'Vista' : 'Tabla';

      markdown += `### ${table.name} ${table.type === 'VIEW' ? '(Vista)' : ''}\n\n`;
      markdown += `**Tipo:** ${tableType}  \n`;
      markdown += `**Descripción:** ${tableDescriptions[table.name] || 'Tabla del sistema'}  \n\n`;

      // Columnas
      markdown += `#### Estructura de Campos\n\n`;
      markdown += `| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |\n`;
      markdown += `|-------|------|----------|------|-------|---------|-------|-------------|\n`;

      for (const col of table.columns) {
        const fieldName = col.COLUMN_NAME;
        const dataType = col.DATA_TYPE.toUpperCase();
        const length = col.CHARACTER_MAXIMUM_LENGTH || (col.NUMERIC_PRECISION ? `${col.NUMERIC_PRECISION}${col.NUMERIC_SCALE ? ',' + col.NUMERIC_SCALE : ''}` : '-');
        const nullable = col.IS_NULLABLE === 'YES' ? 'Sí' : 'No';
        const key = col.COLUMN_KEY === 'PRI' ? 'PK' : (col.COLUMN_KEY === 'UNI' ? 'UNIQUE' : (col.COLUMN_KEY === 'MUL' ? 'FK' : '-'));
        const defaultVal = col.COLUMN_DEFAULT !== null ? col.COLUMN_DEFAULT : '-';
        const extra = col.EXTRA || '-';
        const description = col.COLUMN_COMMENT || getColumnDescription(table.name, fieldName);

        markdown += `| ${fieldName} | ${dataType} | ${length} | ${nullable} | ${key} | ${defaultVal} | ${extra} | ${description} |\n`;
      }

      markdown += `\n`;

      // Foreign Keys
      if (table.foreignKeys && table.foreignKeys.length > 0) {
        markdown += `#### Relaciones (Foreign Keys)\n\n`;
        markdown += `| Constraint | Campo Local | Tabla Referenciada | Campo Referenciado |\n`;
        markdown += `|------------|-------------|--------------------|-----------------|\n`;

        for (const fk of table.foreignKeys) {
          markdown += `| ${fk.CONSTRAINT_NAME} | ${fk.COLUMN_NAME} | ${fk.REFERENCED_TABLE_NAME} | ${fk.REFERENCED_COLUMN_NAME} |\n`;
        }

        markdown += `\n`;
      }

      // Índices
      if (table.indexes && table.indexes.length > 0) {
        const groupedIndexes = groupIndexesByName(table.indexes);

        markdown += `#### Índices\n\n`;
        markdown += `| Nombre | Único | Tipo | Columnas |\n`;
        markdown += `|--------|-------|------|----------|\n`;

        for (const idx of groupedIndexes) {
          markdown += `| ${idx.name} | ${idx.unique ? 'Sí' : 'No'} | ${idx.type} | ${idx.columns.join(', ')} |\n`;
        }

        markdown += `\n`;
      }

      markdown += `---\n\n`;
    }
  }

  // Agregar tablas no categorizadas
  const categorizedTables = Object.values(moduleCategories).flat();
  const uncategorizedTables = dbInfo.tables.filter(t => !categorizedTables.includes(t.name));

  if (uncategorizedTables.length > 0) {
    markdown += `## Tablas Adicionales\n\n`;

    for (const table of uncategorizedTables) {
      markdown += `### ${table.name}\n\n`;
      markdown += `**Tipo:** ${table.type === 'VIEW' ? 'Vista' : 'Tabla'}  \n`;
      markdown += `**Descripción:** Tabla del sistema  \n\n`;

      // Columnas
      markdown += `#### Estructura de Campos\n\n`;
      markdown += `| Campo | Tipo | Longitud | Nulo | Clave | Default | Extra | Descripción |\n`;
      markdown += `|-------|------|----------|------|-------|---------|-------|-------------|\n`;

      for (const col of table.columns) {
        const fieldName = col.COLUMN_NAME;
        const dataType = col.DATA_TYPE.toUpperCase();
        const length = col.CHARACTER_MAXIMUM_LENGTH || (col.NUMERIC_PRECISION ? `${col.NUMERIC_PRECISION}${col.NUMERIC_SCALE ? ',' + col.NUMERIC_SCALE : ''}` : '-');
        const nullable = col.IS_NULLABLE === 'YES' ? 'Sí' : 'No';
        const key = col.COLUMN_KEY === 'PRI' ? 'PK' : (col.COLUMN_KEY === 'UNI' ? 'UNIQUE' : (col.COLUMN_KEY === 'MUL' ? 'FK' : '-'));
        const defaultVal = col.COLUMN_DEFAULT !== null ? col.COLUMN_DEFAULT : '-';
        const extra = col.EXTRA || '-';
        const description = getColumnDescription(table.name, fieldName);

        markdown += `| ${fieldName} | ${dataType} | ${length} | ${nullable} | ${key} | ${defaultVal} | ${extra} | ${description} |\n`;
      }

      markdown += `\n---\n\n`;
    }
  }

  // Pie de página
  markdown += `---\n\n`;
  markdown += `## Notas\n\n`;
  markdown += `- **PK**: Primary Key (Clave Primaria)\n`;
  markdown += `- **FK**: Foreign Key (Clave Foránea)\n`;
  markdown += `- **UNIQUE**: Índice único\n`;
  markdown += `- **auto_increment**: Campo autoincrementable\n`;
  markdown += `- Las fechas están almacenadas en formato TIMESTAMP o DATETIME\n`;
  markdown += `- Los campos con sufijo _at generalmente representan timestamps\n`;
  markdown += `- Los campos deleted_at implementan eliminación lógica (soft delete)\n\n`;
  markdown += `---\n\n`;
  markdown += `*Documento generado automáticamente desde la base de datos MySQL*\n`;

  // Crear directorio si no existe
  const outputDir = 'C:\\Users\\carlo\\OneDrive\\Escritorio\\ProsperPOS';

  const outputPath = `${outputDir}\\DICCIONARIO_DATOS_PROSPERPOS.md`;

  // Guardar el archivo
  await fs.writeFile(outputPath, markdown, 'utf8');

  console.log(`✓ Diccionario de datos generado exitosamente en ${outputPath}`);
  console.log(`✓ Total de tablas documentadas: ${dbInfo.tables.length}`);
  console.log(`✓ Módulos organizados: ${Object.keys(moduleCategories).length}`);
}

createMarkdownDictionary().catch(console.error);
