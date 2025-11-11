// ===================================================================
// SCRIPT PARA INSERTAR SUBCATEGORÍAS
// ===================================================================

const db = require('../src/utils/database');
const logger = require('../src/utils/logger');

const subcategories = [
  // PORCELANATO (category_id: 1)
  { name: 'PORCELANATO 60X60CM', category_id: 1 },
  { name: 'PORCELANATO 60X120CM', category_id: 1 },
  { name: 'PORCELANATO 80X80CM', category_id: 1 },
  { name: 'PORCELANATO 90X180CM', category_id: 1 },
  { name: 'PORCELANATO 100X100CM', category_id: 1 },
  { name: 'PORCELANATO 60X120CM PD', category_id: 1 },
  { name: 'PORCELANATO 60X60CM PD', category_id: 1 },

  // PAREDES (category_id: 2)
  { name: 'PAREDES 30X45CM', category_id: 2 },
  { name: 'PAREDES 30X60CM', category_id: 2 },
  { name: 'PAREDES BAÑO 25X33CM', category_id: 2 },
  { name: 'PAREDES COCINA 25X33CM', category_id: 2 },
  { name: 'PAREDES 32X57CM', category_id: 2 },
  { name: 'PAREDES 20X60CM', category_id: 2 },
  { name: 'CERAMICA 30X58', category_id: 2 },
  { name: 'CERAMICA 53X53CM', category_id: 2 },
  { name: 'CERAMICA 45X91', category_id: 2 },
  { name: 'CERAMICA 30X30CM', category_id: 2 },

  // FACHALETAS (category_id: 3)
  { name: 'FACHALETAS 30X45CM', category_id: 3 },
  { name: 'FACHALETAS 36X50CM', category_id: 3 },
  { name: '29.5X49.5', category_id: 3 },
  { name: 'COMBO', category_id: 3 },

  // CERAMICA PARA PISO (category_id: 4)
  { name: 'CERAMICAS 46X46CM', category_id: 4 },
  { name: 'CERAMICAS 45X45CM', category_id: 4 },
  { name: 'CERAMICAS 60X60CM', category_id: 4 },
  { name: 'CERAMICA PISO DE DUCHA', category_id: 4 },
  { name: 'CERAMICA INTERIOR 33X33CM', category_id: 4 },
  { name: 'CERAMICA EXTERIOR 33X33CM', category_id: 4 },
  { name: 'CERAMICA EXTERIOR 45X45CM', category_id: 4 },
  { name: 'CERAMICA 20X60CM', category_id: 4 },
  { name: 'CERAMICA 57X57CM', category_id: 4 },
  { name: 'CERAMICA 58X118CM', category_id: 4 },
  { name: 'CERAMICA 68X68CM', category_id: 4 },
  { name: 'CERAMICA 91X91CM', category_id: 4 },
  { name: 'CERAMICA 50X50', category_id: 4 },

  // ADHESIVOS (category_id: 5)
  { name: 'PEGAMENTOS', category_id: 5 },
  { name: 'FRAGUADORES', category_id: 5 },
  { name: 'SEPARADORES', category_id: 5 },
  { name: 'LIBREADOS', category_id: 5 },

  // TERRAZOS (category_id: 6)
  { name: 'TERRAZOS 40X40CM', category_id: 6 },
  { name: 'TERRAZOS 30X30CM', category_id: 6 },

  // LOZA SANITARIA (category_id: 7)
  { name: 'LAVAMANOS', category_id: 7 },
  { name: 'BAÑERAS', category_id: 7 },
  { name: 'MUEBLES DE BAÑO', category_id: 7 },
  { name: 'DUCHAS', category_id: 7 },
  { name: 'LAVASTROS', category_id: 7 },
  { name: 'ESPEJO LED', category_id: 7 },
  { name: 'LLAVE PARA LAVAMANOS', category_id: 7 },

  // LADRILLOS (category_id: 8)
  { name: 'MURO', category_id: 8 },

  // TEJAS (category_id: 9)
  { name: 'TEJAS', category_id: 9 },

  // OTROS (category_id: 11)
  { name: 'PERFILES', category_id: 11 },
  { name: 'DISCOS DE CORTAR', category_id: 11 },

  // TABLILLA PVC (category_id: 13)
  { name: 'TABLILLA PVC', category_id: 13 },
  { name: 'ESQUINEROS PVC', category_id: 13 },
  { name: 'UNIONES H JOIN', category_id: 13 },

  // DECK/SIDING WPC (category_id: 14)
  { name: 'ACCESORIOS', category_id: 14 },
  { name: 'DECK', category_id: 14 },
  { name: 'SIDING', category_id: 14 },

  // WPC PANEL (category_id: 15)
  { name: 'WPC PANEL 0.16X2.90M', category_id: 15 },
  { name: 'WPC PANEL 0.14X2.90M', category_id: 15 },

  // SALDOS (category_id: 17)
  { name: 'DESCONTINUADAS GALA 46X46CM', category_id: 17 },
  { name: 'SALDOS GALA 46X46', category_id: 17 },
  { name: 'DESCONTINUADAS SL 45X45', category_id: 17 },
  { name: 'SALDOS HISPACENSA 45X45', category_id: 17 },
  { name: 'SALDOS HISPACENSA 20X60', category_id: 17 },
  { name: 'SALDOS HISPACENSA 33X33', category_id: 17 },
  { name: 'SALDOS UNICESA 33X33', category_id: 17 },
  { name: 'SALDOS BRASILEÑOS', category_id: 17 },
  { name: 'DESCONTINUADAS HISPACENSA 33X33', category_id: 17 },
  { name: 'SALDOS PORCELANATOS 60X120CM', category_id: 17 },
  { name: 'SALDOS PORCELANATOS 60X60', category_id: 17 },

  // LAMINAS DE HIERRO (category_id: 18)
  { name: 'PUERTAS DE HIERRO', category_id: 18 },
  { name: 'PORTONES', category_id: 18 },

  // ACCESORIOS (category_id: 19)
  { name: 'PLANAS DENTADAS', category_id: 19 },
  { name: 'PLANAS CON ESPONJA', category_id: 19 },
  { name: 'MARTILLOS DE HULE', category_id: 19 },
  { name: 'VENTOSAS', category_id: 19 },
  { name: 'OTROS', category_id: 19 },
  { name: 'NIVELADORES', category_id: 19 },

  // PISO DE PVC SPC (category_id: 24)
  { name: 'PISO SPC', category_id: 24 },
  { name: 'PISO VINIL', category_id: 24 },

  // MURALES RELIGIOSOS (category_id: 10)
  { name: 'INODOROS', category_id: 10 },
  { name: 'PISO', category_id: 10 },
  { name: 'MOLDURAS', category_id: 10 },
];

async function insertSubcategories() {
  try {
    console.log('🚀 Iniciando inserción de subcategorías...\n');

    await db.connectDatabase();

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const subcategory of subcategories) {
      try {
        // Verificar si ya existe
        const existing = await db.execute(
          'SELECT id FROM subcategories WHERE name = ? AND category_id = ? AND deleted_at IS NULL',
          [subcategory.name, subcategory.category_id]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Saltando: ${subcategory.name} (ya existe)`);
          skipped++;
          continue;
        }

        // Insertar
        const query = `
          INSERT INTO subcategories (name, category_id, is_active, created_at)
          VALUES (?, ?, 1, NOW())
        `;

        await db.execute(query, [subcategory.name, subcategory.category_id]);

        console.log(`✅ Insertada: ${subcategory.name} (Categoría ID: ${subcategory.category_id})`);
        inserted++;

      } catch (error) {
        console.error(`❌ Error insertando ${subcategory.name}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 RESUMEN:');
    console.log(`   ✅ Insertadas: ${inserted}`);
    console.log(`   ⏭️  Saltadas: ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📦 Total: ${subcategories.length}`);

    await db.closeDatabase();

    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  }
}

// Ejecutar
insertSubcategories();
