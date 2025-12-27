// ===================================================================
// MIGRACIÓN: Modificar columnas de tabla products
// ===================================================================
// Cambios:
// 1. Eliminar columna stock
// 2. Eliminar columna dimensions
// 3. Eliminar columna fractional
// 4. Cambiar unit (VARCHAR) por unit_id (INT)
// 5. Asignar valores por defecto según categorías

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔄 Iniciando migración de tabla products...\n');

    // 1. Primero, verificar las categorías existentes
    console.log('📋 Consultando categorías...');
    const [categories] = await connection.execute('SELECT id, name FROM categories ORDER BY id');
    console.log('Categorías encontradas:');
    categories.forEach(cat => console.log(`  - ID ${cat.id}: ${cat.name}`));
    console.log('');

    // 2. Agregar columna unit_id si no existe
    console.log('📝 Verificando si existe columna unit_id...');
    const [existingColumns] = await connection.execute(`
      SHOW COLUMNS FROM products LIKE 'unit_id'
    `);

    if (existingColumns.length === 0) {
      console.log('  - Agregando columna unit_id...');
      await connection.execute(`
        ALTER TABLE products
        ADD COLUMN unit_id INT NULL AFTER unit
      `);
      console.log('✅ Columna unit_id agregada\n');
    } else {
      console.log('✅ Columna unit_id ya existe\n');
    }

    // 3. Migrar datos de unit a unit_id basándose en las categorías
    console.log('🔄 Migrando datos de unit a unit_id según categorías...');

    // Categorías que usan M² (unit_id = 2)
    // ID 1: PORCELANATO, ID 4: CERAMICA PARA PISO, ID 2: PAREDES, ID 3: FACHALETAS
    // ID 6: TERRAZOS, ID 8: LADRILLOS, ID 9: TEJAS, ID 12: PLIEGOS, ID 13: TABLILLA PVC
    // ID 14: DECK/SIDING WPC, ID 15: WPC PANEL, ID 16: LAMINAS DE SIMIL PVC, ID 18: LAMINAS DE HIERRO
    // ID 20: TABLA YESO, ID 21: PLYWOOD, ID 22: PLYROCK, ID 23: ENCHAPE, ID 24: PISO DE PVC SPC
    const m2Categories = [1, 4, 2, 3, 6, 8, 9, 12, 13, 14, 15, 16, 18, 20, 21, 22, 23, 24];

    for (const categoryId of m2Categories) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        await connection.execute(`
          UPDATE products
          SET unit_id = 2
          WHERE category_id = ? AND (unit_id IS NULL OR unit_id = 0)
        `, [categoryId]);
        console.log(`  ✓ Productos de categoría "${category.name}" → unit_id = 2 (M²)`);
      }
    }

    // Categorías que usan KG (unit_id = 4)
    // ID 5: ADHESIVOS
    const kgCategories = [5];

    for (const categoryId of kgCategories) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        await connection.execute(`
          UPDATE products
          SET unit_id = 4
          WHERE category_id = ? AND (unit_id IS NULL OR unit_id = 0)
        `, [categoryId]);
        console.log(`  ✓ Productos de categoría "${category.name}" → unit_id = 4 (KG)`);
      }
    }

    // Asignar unit_id = 1 (Unidad) a todos los demás productos
    // ID 7: LOZA SANITARIA, ID 10: MURALES RELIGIOSOS, ID 11: OTROS, ID 17: SALDOS, ID 19: ACCESORIOS
    await connection.execute(`
      UPDATE products
      SET unit_id = 1
      WHERE unit_id IS NULL OR unit_id = 0
    `);
    console.log('  ✓ Productos restantes → unit_id = 1 (Unidad)');
    console.log('');

    // 4. Verificar que todos los productos tienen unit_id
    const [productsWithoutUnit] = await connection.execute(`
      SELECT COUNT(*) as count FROM products WHERE unit_id IS NULL OR unit_id = 0
    `);

    if (productsWithoutUnit[0].count > 0) {
      console.log(`⚠️  ADVERTENCIA: ${productsWithoutUnit[0].count} productos sin unit_id\n`);
      throw new Error('Aún hay productos sin unit_id asignado');
    } else {
      console.log('✅ Todos los productos tienen unit_id asignado\n');
    }

    // 5. Eliminar columna unit
    console.log('🗑️  Eliminando columna unit...');
    const [unitCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'unit'`);
    if (unitCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN unit`);
      console.log('✅ Columna unit eliminada\n');
    } else {
      console.log('✅ Columna unit ya estaba eliminada\n');
    }

    // 6. Eliminar columna stock
    console.log('🗑️  Eliminando columna stock...');
    const [stockCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'stock'`);
    if (stockCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN stock`);
      console.log('✅ Columna stock eliminada\n');
    } else {
      console.log('✅ Columna stock ya estaba eliminada\n');
    }

    // 7. Eliminar columna dimensions
    console.log('🗑️  Eliminando columna dimensions...');
    const [dimensionsCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'dimensions'`);
    if (dimensionsCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN dimensions`);
      console.log('✅ Columna dimensions eliminada\n');
    } else {
      console.log('✅ Columna dimensions ya estaba eliminada\n');
    }

    // 8. Eliminar columna fractional
    console.log('🗑️  Eliminando columna fractional...');
    const [fractionalCol] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'fractional'`);
    if (fractionalCol.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN fractional`);
      console.log('✅ Columna fractional eliminada\n');
    } else {
      console.log('✅ Columna fractional ya estaba eliminada\n');
    }

    // 9. Verificar estructura final
    console.log('📊 Verificando estructura final de la tabla products...');
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM products
    `);

    const hasUnit = columns.some(col => col.Field === 'unit');
    const hasUnitId = columns.some(col => col.Field === 'unit_id');
    const hasStock = columns.some(col => col.Field === 'stock');
    const hasDimensions = columns.some(col => col.Field === 'dimensions');
    const hasFractional = columns.some(col => col.Field === 'fractional');

    console.log('Verificación:');
    console.log(`  - Columna "unit": ${hasUnit ? '❌ AÚN EXISTE' : '✅ ELIMINADA'}`);
    console.log(`  - Columna "unit_id": ${hasUnitId ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    console.log(`  - Columna "stock": ${hasStock ? '❌ AÚN EXISTE' : '✅ ELIMINADA'}`);
    console.log(`  - Columna "dimensions": ${hasDimensions ? '❌ AÚN EXISTE' : '✅ ELIMINADA'}`);
    console.log(`  - Columna "fractional": ${hasFractional ? '❌ AÚN EXISTE' : '✅ ELIMINADA'}`);
    console.log('');

    // 10. Mostrar resumen de productos por unit_id
    console.log('📊 Resumen de productos por unidad:');
    const [unitStats] = await connection.execute(`
      SELECT
        u.id,
        u.name as unit_name,
        COUNT(p.id) as product_count
      FROM units u
      LEFT JOIN products p ON p.unit_id = u.id
      GROUP BY u.id, u.name
      ORDER BY product_count DESC
    `);

    unitStats.forEach(stat => {
      console.log(`  - ${stat.unit_name}: ${stat.product_count} productos`);
    });
    console.log('');

    console.log('✅ Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar migración
migrate()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
