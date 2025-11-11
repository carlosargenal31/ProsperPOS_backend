// ===================================================================
// PROSPERPOS - SCRIPT PARA ACTUALIZAR MARCAS
// ===================================================================
// Este script actualiza las marcas existentes con nombres reales
// ===================================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const brandNames = [
  'KARINA',
  'VITRIFIED TILES',
  'HISPACENSA',
  'CERA',
  'SAN LORENZO',
  'GALA',
  'ST',
  'FF',
  'LM',
  'PD',
  'GM PORCELANATO',
  'DIGIKER',
  'SAMBORO',
  'BLUETONE',
  'ULTRACOLOR',
  'CEMIX',
  'PEGADURO',
  'UNICESA'
];

async function updateBrands() {
  let connection;

  try {
    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosperpos',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado a la base de datos');

    // Ver estado actual
    console.log('\n=== ESTADO ACTUAL DE MARCAS ===');
    const [currentBrands] = await connection.execute(`
      SELECT id, name, code, is_active
      FROM brands
      WHERE deleted_at IS NULL
      ORDER BY id ASC
    `);
    console.table(currentBrands);

    // Actualizar o crear marcas
    console.log('\n=== ACTUALIZANDO MARCAS ===');

    for (let i = 0; i < brandNames.length; i++) {
      const brandName = brandNames[i];
      const brandId = i + 1;

      // Generar slug
      const slug = brandName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Verificar si existe la marca
      const [existing] = await connection.execute(
        'SELECT id FROM brands WHERE id = ? AND deleted_at IS NULL',
        [brandId]
      );

      if (existing.length > 0) {
        // Actualizar marca existente
        await connection.execute(`
          UPDATE brands
          SET name = ?, slug = ?, updated_at = NOW()
          WHERE id = ?
        `, [brandName, slug, brandId]);
        console.log(`✅ Actualizada marca ID ${brandId}: ${brandName}`);
      } else {
        // Crear nueva marca
        await connection.execute(`
          INSERT INTO brands (id, name, slug, is_active, created_by, created_at)
          VALUES (?, ?, ?, 1, 1, NOW())
        `, [brandId, brandName, slug]);
        console.log(`✅ Creada marca ID ${brandId}: ${brandName}`);
      }
    }

    // Ver estado final
    console.log('\n=== ESTADO FINAL DE MARCAS ===');
    const [finalBrands] = await connection.execute(`
      SELECT id, name, code, slug, is_active
      FROM brands
      WHERE deleted_at IS NULL
      ORDER BY id ASC
    `);
    console.table(finalBrands);

    console.log('\n✅ Marcas actualizadas exitosamente');

  } catch (error) {
    console.error('❌ Error al actualizar marcas:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexión cerrada');
    }
  }
}

// Ejecutar el script
updateBrands()
  .then(() => {
    console.log('\n🎉 Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
