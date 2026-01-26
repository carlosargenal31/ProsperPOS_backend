const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '310104',
  database: 'prosperpos'
};

(async () => {
  try {
    const conn = await mysql.createConnection(config);

    // Primero verificar si ya existe
    const [existing] = await conn.execute(
      'SELECT id FROM offers WHERE codigo = ?',
      ['OFERTA-TEST-001']
    );

    if (existing.length > 0) {
      console.log('✅ Oferta ya existe con ID:', existing[0].id);
      await conn.end();
      return;
    }

    // Crear oferta de prueba (tipo multiple)
    const [result] = await conn.execute(`
      INSERT INTO offers (
        codigo, nombre, agencia_id, tipo_aplicacion,
        limitar_fecha, tipo_descuento, valor_descuento,
        aplica_lunes, aplica_martes, aplica_miercoles, aplica_jueves,
        aplica_viernes, aplica_sabado, aplica_domingo,
        aplica_para, monto_minimo, is_active, suspendida, created_by
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `, [
      'OFERTA-TEST-001',
      'Oferta de Prueba 30%',
      1,
      'multiple',
      0,
      'porcentaje',
      30,
      1, 1, 1, 1, 1, 1, 1,
      'todos',
      0,
      1,
      0,
      1
    ]);

    const offerId = result.insertId;
    console.log('✅ Oferta creada con ID:', offerId);

    // Obtener código del producto
    const [productData] = await conn.execute('SELECT code FROM products WHERE id = ?', [1019]);
    const productCode = productData[0].code;

    // Agregar productos a la oferta
    await conn.execute(`
      INSERT INTO offer_items (offer_id, product_id, product_code, descuento_porcentaje)
      VALUES (?, ?, ?, ?)
    `, [offerId, 1019, productCode, 30]);

    console.log('✅ Producto 1019 agregado a la oferta con 30% de descuento');

    // Verificar la oferta
    const [oferta] = await conn.execute(
      'SELECT * FROM offers WHERE id = ?',
      [offerId]
    );

    console.log('📋 Detalles de la oferta:', {
      id: oferta[0].id,
      codigo: oferta[0].codigo,
      nombre: oferta[0].nombre,
      tipo_aplicacion: oferta[0].tipo_aplicacion,
      tipo_descuento: oferta[0].tipo_descuento,
      valor_descuento: oferta[0].valor_descuento,
      is_active: oferta[0].is_active
    });

    await conn.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
