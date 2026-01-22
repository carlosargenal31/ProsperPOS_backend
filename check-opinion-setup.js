// Verificar configuración completa de opiniones
const db = require('./src/utils/database');

async function checkSetup() {
  try {
    console.log('🔍 Verificando configuración de opiniones...\n');

    // 1. Verificar tabla
    console.log('1️⃣ Verificando tabla customer_opinions...');
    const tables = await db.query("SHOW TABLES LIKE 'customer_opinions'");
    if (tables.length === 0) {
      console.log('❌ La tabla customer_opinions NO existe');
      return;
    }
    console.log('✅ La tabla customer_opinions existe\n');

    // 2. Verificar permisos
    console.log('2️⃣ Verificando permisos en la tabla permissions...');
    const permissions = await db.query(
      'SELECT * FROM permissions WHERE slug LIKE "opinions.%"'
    );
    console.log(`✅ Encontrados ${permissions.length} permisos de opiniones:`);
    permissions.forEach(p => console.log(`   - ${p.slug} (ID: ${p.id})`));
    console.log('');

    // 3. Verificar asignación al rol Administrator
    console.log('3️⃣ Verificando permisos del rol Administrator (role_id = 1)...');
    const rolePerms = await db.query(
      `SELECT rp.*, p.slug
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = 1 AND p.slug LIKE 'opinions.%'`
    );
    console.log(`✅ El rol Administrator tiene ${rolePerms.length} permisos de opiniones asignados:`);
    rolePerms.forEach(rp => console.log(`   - ${rp.slug}`));
    console.log('');

    // 4. Contar opiniones
    console.log('4️⃣ Contando opiniones en la base de datos...');
    const count = await db.query('SELECT COUNT(*) as total FROM customer_opinions');
    console.log(`📊 Total de opiniones: ${count[0].total}\n`);

    // 5. Verificar estructura de la tabla
    console.log('5️⃣ Estructura de la tabla customer_opinions:');
    const structure = await db.query('DESCRIBE customer_opinions');
    console.table(structure.map(col => ({
      Campo: col.Field,
      Tipo: col.Type,
      Nulo: col.Null,
      Clave: col.Key,
      Default: col.Default
    })));

    console.log('\n✅ Configuración completa verificada exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await db.close();
    process.exit(0);
  }
}

checkSetup();
