const XLSX = require('xlsx');
const mysql = require('mysql2/promise');

async function analyzeBrandsAndSubcategories() {
  // Leer productos del Excel
  const wb = XLSX.readFile('productos 1.xls');
  const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  console.log(`Total productos: ${data.length}`);

  // Analizar productos que tienen "BAÑO" y tamaños específicos (posibles subcategorías)
  const categorias = {};
  const marcas = new Set();
  const tamaños = new Set();

  data.forEach(p => {
    const nombre = p.nombre.toUpperCase();

    // Detectar tipo de producto (categoría principal)
    let tipo = 'GENERAL';
    if (nombre.includes('CERAMICA')) tipo = 'CERAMICA';
    else if (nombre.includes('PORCELANATO')) tipo = 'PORCELANATO';
    else if (nombre.includes('TERRAZO')) tipo = 'TERRAZO';
    else if (nombre.includes('MUEBLE')) tipo = 'MUEBLE';

    if (!categorias[tipo]) categorias[tipo] = [];
    categorias[tipo].push(p.nombre);

    // Extraer tamaños (formato: 25X33CM, 60X60CM, etc.)
    const matchTamaño = nombre.match(/(\d+X\d+CM)/);
    if (matchTamaño) {
      tamaños.add(matchTamaño[1]);
    }

    // Buscar palabras que podrían ser marcas (palabras capitalizadas que no sean palabras comunes)
    const palabrasComunes = ['CERAMICA', 'PORCELANATO', 'TERRAZO', 'PISO', 'PARED', 'MUEBLE', 'BAÑO', 'BAJO', 'LISA', 'NATURAL', 'GRIS', 'BLANCO', 'BEIGE', 'AZUL'];
    const words = nombre.split(' ');
    words.forEach(word => {
      // Si la palabra tiene más de 4 letras y no está en palabras comunes
      if (word.length > 4 && !palabrasComunes.includes(word) && !word.match(/\d/) && !word.includes('CM') && !word.includes('MT')) {
        marcas.add(word);
      }
    });
  });

  console.log('\n=== CATEGORÍAS ENCONTRADAS ===');
  Object.keys(categorias).forEach(cat => {
    console.log(`${cat}: ${categorias[cat].length} productos`);
  });

  console.log('\n=== POSIBLES MARCAS (TOP 20) ===');
  const marcasArray = Array.from(marcas).slice(0, 20);
  marcasArray.forEach(m => console.log(m));

  console.log('\n=== TAMAÑOS ENCONTRADOS (TOP 20) ===');
  const tamañosArray = Array.from(tamaños).slice(0, 20);
  tamañosArray.forEach(t => console.log(t));

  // Productos con "BAÑO" y tamaño específico (ejemplo que mencionaste)
  console.log('\n=== PRODUCTOS CON "BAÑO" Y TAMAÑO 25X33 ===');
  const productosBaño = data.filter(p =>
    p.nombre.toUpperCase().includes('BAÑO') &&
    p.nombre.toUpperCase().includes('25X33')
  );
  productosBaño.forEach(p => console.log(p.nombre));
}

analyzeBrandsAndSubcategories().catch(console.error);
