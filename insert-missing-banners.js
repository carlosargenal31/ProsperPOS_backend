const db = require('./src/utils/database');

(async () => {
  try {
    console.log('Verificando banners existentes...');

    const [existing] = await db.execute('SELECT id FROM banners ORDER BY id');
    console.log(`Banners encontrados: ${existing.length}`);

    // Si ya hay 3 banners, no hacer nada
    if (existing.length >= 3) {
      console.log('✓ Ya existen 3 banners');
      process.exit(0);
    }

    // Crear los banners faltantes
    const bannersToCreate = 3 - existing.length;
    console.log(`Creando ${bannersToCreate} banners faltantes...`);

    for (let i = existing.length + 1; i <= 3; i++) {
      await db.execute(`
        INSERT INTO banners (id, title, description, button_text, link_url, position, is_active, created_at, updated_at)
        VALUES (?, '', '', '', '/shop/catalog', ?, 1, NOW(), NOW())
      `, [i, i]);
      console.log(`✓ Banner ${i} creado`);
    }

    console.log('✓ Todos los banners creados exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
