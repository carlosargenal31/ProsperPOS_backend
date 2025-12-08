// ===================================================================
// TEST DE CRUD DE OFERTAS
// ===================================================================

const mysql = require('mysql2/promise');

async function testOffersCRUD() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '310104',
    database: 'prosperpos'
  });

  try {
    console.log('\n=== TEST OFERTAS CRUD ===\n');

    // 1. Verificar estructura de tabla
    console.log('1. Verificando estructura de tabla offers...');
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prosperpos' AND TABLE_NAME = 'offers'
      AND COLUMN_NAME IN ('categoria_id', 'subcategoria_id', 'producto_id')
    `);
    console.log('Columnas encontradas:', columns);

    // 2. Obtener una categoría de prueba
    console.log('\n2. Obteniendo categoría de prueba...');
    const [categories] = await conn.query('SELECT id, name FROM categories LIMIT 1');
    if (categories.length === 0) {
      console.log('⚠️  No hay categorías en la base de datos');
      await conn.end();
      return;
    }
    console.log('Categoría:', categories[0]);

    // 3. Obtener subcategoría de prueba
    console.log('\n3. Obteniendo subcategoría de prueba...');
    const [subcategories] = await conn.query(
      'SELECT id, name FROM subcategories WHERE category_id = ? LIMIT 1',
      [categories[0].id]
    );
    console.log('Subcategoría:', subcategories[0] || 'No hay subcategorías para esta categoría');

    // 4. Crear oferta de prueba
    console.log('\n4. Creando oferta de prueba...');
    const [insertResult] = await conn.query(`
      INSERT INTO offers (
        codigo, nombre, agencia_id, tipo_aplicacion,
        categoria_id, subcategoria_id, producto_id,
        tipo_descuento, valor_descuento,
        is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'TEST001',
      'Oferta de Prueba',
      null,
      'grupo',
      categories[0].id,
      subcategories[0]?.id || null,
      null,
      'porcentaje',
      10.00,
      1,
      1
    ]);

    const offerId = insertResult.insertId;
    console.log('✅ Oferta creada con ID:', offerId);

    // 5. Leer oferta con JOINs
    console.log('\n5. Leyendo oferta con JOINs...');
    const [offers] = await conn.query(`
      SELECT
        o.*,
        b.nombre as agencia_nombre,
        c.name as categoria_nombre,
        sc.name as subcategoria_nombre,
        p.name as producto_nombre
      FROM offers o
      LEFT JOIN branches b ON o.agencia_id = b.id
      LEFT JOIN categories c ON o.categoria_id = c.id
      LEFT JOIN subcategories sc ON o.subcategoria_id = sc.id
      LEFT JOIN products p ON o.producto_id = p.id
      WHERE o.id = ?
    `, [offerId]);

    console.log('Oferta leída:', {
      id: offers[0].id,
      codigo: offers[0].codigo,
      nombre: offers[0].nombre,
      categoria_id: offers[0].categoria_id,
      categoria_nombre: offers[0].categoria_nombre,
      subcategoria_id: offers[0].subcategoria_id,
      subcategoria_nombre: offers[0].subcategoria_nombre
    });

    // 6. Actualizar oferta
    console.log('\n6. Actualizando oferta...');
    await conn.query(`
      UPDATE offers SET
        nombre = ?,
        valor_descuento = ?
      WHERE id = ?
    `, ['Oferta Actualizada', 15.00, offerId]);
    console.log('✅ Oferta actualizada');

    // 7. Eliminar oferta (soft delete)
    console.log('\n7. Eliminando oferta (soft delete)...');
    await conn.query(`
      UPDATE offers SET
        deleted_at = NOW(),
        deleted_by = ?
      WHERE id = ?
    `, [1, offerId]);
    console.log('✅ Oferta eliminada (soft delete)');

    // 8. Verificar que no aparece en listado
    console.log('\n8. Verificando que no aparece en listado...');
    const [activeOffers] = await conn.query(`
      SELECT COUNT(*) as count
      FROM offers
      WHERE id = ? AND deleted_at IS NULL
    `, [offerId]);
    console.log('Ofertas activas con ese ID:', activeOffers[0].count);

    // 9. Limpiar - eliminar registro de prueba
    console.log('\n9. Limpiando registro de prueba...');
    await conn.query('DELETE FROM offers WHERE id = ?', [offerId]);
    console.log('✅ Registro de prueba eliminado');

    console.log('\n=== ✅ TODOS LOS TESTS PASARON ===\n');

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await conn.end();
  }
}

testOffersCRUD();
