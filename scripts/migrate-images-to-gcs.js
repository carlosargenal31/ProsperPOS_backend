// ===================================================================
// SCRIPT DE MIGRACIÓN DE IMÁGENES A GOOGLE CLOUD STORAGE
// ===================================================================

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const db = require('../src/utils/database');
const { getInstance } = require('../src/utils/google-cloud-storage');

class ImageMigration {
  constructor() {
    this.gcs = getInstance();
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  /**
   * Migrar todas las imágenes de productos
   */
  async migrateProductImages() {
    console.log('\n=== INICIANDO MIGRACIÓN DE IMÁGENES DE PRODUCTOS ===\n');

    try {
      // Obtener productos con imágenes locales
      const [products] = await db.execute(`
        SELECT id, name, image
        FROM products
        WHERE image IS NOT NULL
          AND image != ''
          AND deleted_at IS NULL
          AND image NOT LIKE 'https://storage.googleapis.com/%'
      `);

      this.results.total = products.length;

      console.log(`Total de productos con imágenes locales: ${products.length}\n`);

      for (const product of products) {
        await this.migrateProductImage(product);
      }

      this.printResults();

    } catch (error) {
      console.error('❌ Error en migración:', error);
      throw error;
    }
  }

  /**
   * Migrar imagen de un producto individual
   */
  async migrateProductImage(product) {
    try {
      console.log(`[${product.id}] Procesando: ${product.name}`);

      // Path relativo de la imagen (puede ser /uploads/products/image.jpg o solo image.jpg)
      const imagePath = product.image;

      // Intentar diferentes ubicaciones posibles
      const possiblePaths = [
        path.join(process.cwd(), 'public', imagePath),
        path.join(process.cwd(), 'uploads', imagePath),
        path.join(process.cwd(), imagePath),
        path.join(process.cwd(), 'public', 'uploads', 'products', path.basename(imagePath))
      ];

      let fileBuffer = null;
      let foundPath = null;

      // Buscar el archivo en las ubicaciones posibles
      for (const filePath of possiblePaths) {
        try {
          await fs.access(filePath);
          fileBuffer = await fs.readFile(filePath);
          foundPath = filePath;
          break;
        } catch (error) {
          // Archivo no encontrado en esta ubicación, continuar
          continue;
        }
      }

      if (!fileBuffer) {
        console.log(`   ⚠️  Archivo no encontrado en ubicaciones conocidas`);
        this.results.skipped++;
        this.results.errors.push({
          productId: product.id,
          productName: product.name,
          imagePath,
          error: 'Archivo no encontrado'
        });
        return;
      }

      console.log(`   ✓ Archivo encontrado: ${foundPath}`);

      // Determinar extensión
      const ext = path.extname(imagePath).substring(1) || 'jpg';

      // Subir a Google Cloud Storage
      const result = await this.gcs.uploadProductImage(
        fileBuffer,
        product.id,
        'main',
        {
          extension: ext,
          contentType: `image/${ext}`,
          metadata: {
            originalPath: imagePath,
            migratedAt: new Date().toISOString(),
            productName: product.name
          }
        }
      );

      console.log(`   ✓ Subido a GCS: ${result.url}`);

      // Actualizar URL en la base de datos
      await db.execute(
        'UPDATE products SET image = ?, updated_at = NOW() WHERE id = ?',
        [result.url, product.id]
      );

      console.log(`   ✓ Base de datos actualizada`);
      console.log(`   ✅ Migración exitosa\n`);

      this.results.success++;

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      this.results.failed++;
      this.results.errors.push({
        productId: product.id,
        productName: product.name,
        imagePath: product.image,
        error: error.message
      });
    }
  }

  /**
   * Migrar todas las imágenes de categorías
   */
  async migrateCategoryImages() {
    console.log('\n=== INICIANDO MIGRACIÓN DE IMÁGENES DE CATEGORÍAS ===\n');

    try {
      const [categories] = await db.execute(`
        SELECT id, name, image_url
        FROM categories
        WHERE image_url IS NOT NULL
          AND image_url != ''
          AND deleted_at IS NULL
          AND image_url NOT LIKE 'https://storage.googleapis.com/%'
      `);

      console.log(`Total de categorías con imágenes locales: ${categories.length}\n`);

      for (const category of categories) {
        await this.migrateCategoryImage(category);
      }

    } catch (error) {
      console.error('❌ Error en migración de categorías:', error);
      throw error;
    }
  }

  /**
   * Migrar imagen de una categoría individual
   */
  async migrateCategoryImage(category) {
    try {
      console.log(`[${category.id}] Procesando categoría: ${category.name}`);

      const imagePath = category.image_url;

      const possiblePaths = [
        path.join(process.cwd(), 'public', imagePath),
        path.join(process.cwd(), 'uploads', imagePath),
        path.join(process.cwd(), imagePath),
        path.join(process.cwd(), 'public', 'uploads', 'categories', path.basename(imagePath))
      ];

      let fileBuffer = null;
      let foundPath = null;

      for (const filePath of possiblePaths) {
        try {
          await fs.access(filePath);
          fileBuffer = await fs.readFile(filePath);
          foundPath = filePath;
          break;
        } catch (error) {
          continue;
        }
      }

      if (!fileBuffer) {
        console.log(`   ⚠️  Archivo no encontrado\n`);
        return;
      }

      console.log(`   ✓ Archivo encontrado: ${foundPath}`);

      const ext = path.extname(imagePath).substring(1) || 'jpg';

      const result = await this.gcs.uploadCategoryImage(
        fileBuffer,
        category.id,
        {
          extension: ext,
          contentType: `image/${ext}`,
          metadata: {
            originalPath: imagePath,
            migratedAt: new Date().toISOString(),
            categoryName: category.name
          }
        }
      );

      console.log(`   ✓ Subido a GCS: ${result.url}`);

      await db.execute(
        'UPDATE categories SET image_url = ?, updated_at = NOW() WHERE id = ?',
        [result.url, category.id]
      );

      console.log(`   ✅ Categoría migrada exitosamente\n`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  /**
   * Imprimir resultados de la migración
   */
  printResults() {
    console.log('\n=======================================================');
    console.log('           RESUMEN DE MIGRACIÓN');
    console.log('=======================================================');
    console.log(`Total de imágenes:     ${this.results.total}`);
    console.log(`✅ Migradas exitosas:  ${this.results.success}`);
    console.log(`⚠️  Omitidas:          ${this.results.skipped}`);
    console.log(`❌ Fallidas:           ${this.results.failed}`);
    console.log('=======================================================\n');

    if (this.results.errors.length > 0) {
      console.log('ERRORES DETALLADOS:');
      console.log('-------------------');
      this.results.errors.forEach((err, index) => {
        console.log(`${index + 1}. Producto ID ${err.productId}: ${err.productName}`);
        console.log(`   Path: ${err.imagePath}`);
        console.log(`   Error: ${err.error}\n`);
      });
    }
  }

  /**
   * Generar reporte en JSON
   */
  async generateReport() {
    const reportPath = path.join(process.cwd(), 'migration-report.json');

    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      errors: this.results.errors
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Reporte guardado en: ${reportPath}\n`);
  }
}

// ===================================================================
// EJECUTAR MIGRACIÓN
// ===================================================================

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   MIGRACIÓN DE IMÁGENES A GOOGLE CLOUD STORAGE            ║');
  console.log('║   ProsperPOS                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Verificar variables de entorno
  const requiredEnvVars = [
    'GCP_PROJECT_ID',
    'GCS_BUCKET_NAME',
    'GCS_KEYFILE_PATH'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Error: Faltan las siguientes variables de entorno:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nConfigura estas variables en tu archivo .env\n');
    process.exit(1);
  }

  console.log('✓ Variables de entorno verificadas');
  console.log(`✓ Proyecto: ${process.env.GCP_PROJECT_ID}`);
  console.log(`✓ Bucket: ${process.env.GCS_BUCKET_NAME}\n`);

  const migration = new ImageMigration();

  try {
    // Migrar imágenes de productos
    await migration.migrateProductImages();

    // Migrar imágenes de categorías
    await migration.migrateCategoryImages();

    // Generar reporte
    await migration.generateReport();

    console.log('✅ Migración completada exitosamente\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error fatal en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = ImageMigration;
