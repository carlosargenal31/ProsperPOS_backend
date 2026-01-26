const SubcategoryService = require('./src/services/subcategory.service');

(async () => {
  try {
    console.log('🔍 Probando obtener subcategorías...\n');

    const subcategories = await SubcategoryService.getSubcategories({});

    console.log(`✅ Total de subcategorías: ${subcategories.length}\n`);

    if (subcategories.length > 0) {
      console.log('📋 Primera subcategoría:');
      console.log(JSON.stringify(subcategories[0], null, 2));

      console.log('\n📊 Campos disponibles:');
      console.log(Object.keys(subcategories[0]));

      console.log('\n🔍 Verificando category_name:');
      subcategories.forEach((sub, idx) => {
        console.log(`${idx + 1}. ${sub.name} -> Categoría: ${sub.category_name || 'SIN CATEGORIA'}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
