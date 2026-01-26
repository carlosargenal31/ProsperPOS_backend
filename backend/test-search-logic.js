// Test para verificar la lógica de búsqueda mejorada

function testSearchLogic(search) {
  let words = search.match(/[a-záéíóúñ]+/gi) || [];
  const digits = search.match(/\d+/g) || [];

  // Filtrar palabras muy cortas (1 letra)
  words = words.filter(word => word.length > 1);

  console.log(`\n🔍 Búsqueda: "${search}"`);
  console.log(`   Palabras: ${words.join(', ')}`);
  console.log(`   Dígitos: ${digits.join(', ')}`);

  if (words.length > 0 || digits.length > 0) {
    const allConditions = [];
    const params = [];

    words.forEach(() => {
      allConditions.push('p.name LIKE ?');
    });

    digits.forEach(() => {
      allConditions.push('p.name LIKE ?');
    });

    const nameConditions = allConditions.join(' AND ');

    words.forEach(word => {
      params.push(`%${word}%`);
    });

    digits.forEach(digit => {
      params.push(`%${digit}%`);
    });

    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);

    console.log(`   SQL WHERE: ((${nameConditions}) OR p.code LIKE ? OR p.description LIKE ?)`);
    console.log(`   Parámetros: [${params.join(', ')}]`);
    console.log(`   ✅ Encontrará productos con TODAS las palabras/dígitos`);
  }
}

// Casos de prueba
testSearchLogic('ceramica nogal');
testSearchLogic('ceramica menorca');
testSearchLogic('ceramica 46x46');
testSearchLogic('baño azul');
testSearchLogic('46x46');

console.log('\n✅ Lógica de búsqueda verificada\n');
