const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPhysicalInventory() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prosperpos'
  });

  try {
    console.log('✅ Conectado a la base de datos\n');

    // Simular la consulta del servicio sin agrupar por bodega
    const query = `
      SELECT
        p.id,
        p.name as nombre,
        p.code as codigo,
        c.name as categoria,
        sc.name as subcategoria,
        b.name as marca,
        p.unit as unidad_medida,
        w.id as warehouse_id,
        w.nombre as almacen,
        COALESCE(stock_data.stock_quantity, 0) as cantidad
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      CROSS JOIN warehouses w
      LEFT JOIN (
        SELECT
          s.product_id,
          s.warehouse_id,
          SUM(COALESCE(s.quantity, 0)) as stock_quantity
        FROM stock s
        GROUP BY s.product_id, s.warehouse_id
      ) stock_data ON stock_data.product_id = p.id AND stock_data.warehouse_id = w.id
      WHERE p.deleted_at IS NULL AND p.status = 'active' AND w.deleted_at IS NULL
      ORDER BY p.name
      LIMIT 10
    `;

    const [rows] = await connection.query(query);

    console.log(`📊 Total de filas devueltas: ${rows.length}\n`);

    rows.forEach((row, index) => {
      console.log(`Fila ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Nombre: ${row.nombre}`);
      console.log(`  Código: ${row.codigo}`);
      console.log(`  Categoría: ${row.categoria}`);
      console.log(`  Subcategoría: ${row.subcategoria}`);
      console.log(`  Bodega: ${row.almacen}`);
      console.log(`  Cantidad: ${row.cantidad}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    console.log('\n✅ Conexión cerrada');
  }
}

testPhysicalInventory();
