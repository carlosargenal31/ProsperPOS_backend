// ===================================================================
// SCRIPT DE PRUEBA DE UPLOAD A GOOGLE CLOUD STORAGE
// ===================================================================

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { getInstance } = require('../src/utils/google-cloud-storage');

async function testGCSUpload() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST DE UPLOAD A GOOGLE CLOUD STORAGE                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Verificar variables de entorno
  console.log('📋 Configuración:');
  console.log(`   Proyecto: ${process.env.GCP_PROJECT_ID || 'NO CONFIGURADO'}`);
  console.log(`   Bucket: ${process.env.GCS_BUCKET_NAME || 'NO CONFIGURADO'}`);
  console.log(`   Key File: ${process.env.GCS_KEYFILE_PATH || 'NO CONFIGURADO'}`);
  console.log('\n');

  const requiredVars = ['GCP_PROJECT_ID', 'GCS_BUCKET_NAME', 'GCS_KEYFILE_PATH'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Error: Faltan variables de entorno:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n');
    process.exit(1);
  }

  // Verificar que el archivo de credenciales existe
  try {
    await fs.access(process.env.GCS_KEYFILE_PATH);
    console.log('✓ Archivo de credenciales encontrado\n');
  } catch (error) {
    console.error('❌ Error: Archivo de credenciales no encontrado');
    console.error(`   Path: ${process.env.GCS_KEYFILE_PATH}\n`);
    process.exit(1);
  }

  try {
    const gcs = getInstance();

    // Test 1: Verificar información del bucket
    console.log('📊 Test 1: Información del bucket');
    try {
      const bucketInfo = await gcs.getBucketInfo();
      console.log(`   Nombre: ${bucketInfo.name}`);
      console.log(`   Ubicación: ${bucketInfo.location}`);
      console.log(`   Clase de almacenamiento: ${bucketInfo.storageClass}`);
      console.log('   ✓ Test exitoso\n');
    } catch (error) {
      console.error('   ❌ Error al obtener información del bucket');
      console.error(`   ${error.message}\n`);
      throw error;
    }

    // Test 2: Crear imagen de prueba
    console.log('📊 Test 2: Crear imagen de prueba');
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    console.log(`   Buffer creado: ${testImageBuffer.length} bytes`);
    console.log('   ✓ Test exitoso\n');

    // Test 3: Subir archivo de prueba
    console.log('📊 Test 3: Subir archivo de prueba a GCS');
    const testFileName = `test_${Date.now()}.png`;
    const uploadResult = await gcs.uploadFile(
      testImageBuffer,
      testFileName,
      'test',
      {
        contentType: 'image/png',
        metadata: {
          testFile: true,
          uploadedAt: new Date().toISOString()
        }
      }
    );
    console.log(`   ✓ Archivo subido exitosamente`);
    console.log(`   URL: ${uploadResult.url}`);
    console.log(`   Destino: ${uploadResult.destination}\n`);

    // Test 4: Verificar que el archivo existe
    console.log('📊 Test 4: Verificar existencia del archivo');
    const exists = await gcs.fileExists(uploadResult.destination);
    if (exists) {
      console.log('   ✓ Archivo existe en GCS\n');
    } else {
      console.log('   ❌ Archivo no encontrado en GCS\n');
      throw new Error('Archivo no encontrado después de upload');
    }

    // Test 5: Listar archivos en carpeta test
    console.log('📊 Test 5: Listar archivos en carpeta test');
    const files = await gcs.listFiles('test', { limit: 10 });
    console.log(`   Archivos encontrados: ${files.length}`);
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${file.size} bytes)`);
    });
    console.log('   ✓ Test exitoso\n');

    // Test 6: Generar URL firmada
    console.log('📊 Test 6: Generar URL firmada');
    const signedUrl = await gcs.getSignedUrl(uploadResult.destination, 5);
    console.log('   ✓ URL firmada generada');
    console.log(`   URL: ${signedUrl.substring(0, 80)}...`);
    console.log('   Expira en: 5 minutos\n');

    // Test 7: Eliminar archivo de prueba
    console.log('📊 Test 7: Eliminar archivo de prueba');
    await gcs.deleteFile(uploadResult.destination);
    console.log('   ✓ Archivo eliminado exitosamente\n');

    // Test 8: Verificar que fue eliminado
    console.log('📊 Test 8: Verificar eliminación');
    const stillExists = await gcs.fileExists(uploadResult.destination);
    if (!stillExists) {
      console.log('   ✓ Archivo eliminado correctamente\n');
    } else {
      console.log('   ⚠️  Archivo aún existe\n');
    }

    // Test 9: Test de upload de producto
    console.log('📊 Test 9: Test de upload de producto simulado');
    const productTestBuffer = testImageBuffer;
    const productResult = await gcs.uploadProductImage(
      productTestBuffer,
      999999, // ID de prueba
      'main',
      {
        extension: 'png',
        contentType: 'image/png',
        metadata: {
          testProduct: true
        }
      }
    );
    console.log('   ✓ Imagen de producto subida');
    console.log(`   URL: ${productResult.url}\n`);

    // Limpiar
    await gcs.deleteFile(productResult.destination);
    console.log('   ✓ Archivo de prueba eliminado\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TODOS LOS TESTS DE GCS COMPLETADOS EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('💡 Próximos pasos:');
    console.log('   1. Ejecutar migración de imágenes: npm run migrate:images');
    console.log('   2. Probar endpoints de upload desde el frontend');
    console.log('   3. Configurar Cloud CDN para mejor rendimiento\n');

  } catch (error) {
    console.error('\n❌ Error en test de GCS:\n');
    console.error(`   ${error.message}\n`);

    console.error('💡 Posibles soluciones:\n');
    console.error('   1. Verifica que el bucket existe en Google Cloud Console');
    console.error('   2. Verifica permisos del Service Account');
    console.error('   3. Asegúrate de que las APIs están habilitadas');
    console.error('   4. Revisa que el archivo de credenciales sea válido\n');

    process.exit(1);
  }
}

// Ejecutar test
testGCSUpload();
