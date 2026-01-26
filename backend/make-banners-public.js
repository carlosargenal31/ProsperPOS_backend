const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

async function makeBannersPublic() {
  try {
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCS_KEYFILE_PATH
    });

    const bucketName = process.env.GCS_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);

    console.log(`📦 Bucket: ${bucketName}`);
    console.log('🔍 Buscando archivos en carpeta banners/...\n');

    // Listar archivos en la carpeta banners
    const [files] = await bucket.getFiles({
      prefix: 'banners/'
    });

    if (files.length === 0) {
      console.log('❌ No se encontraron archivos en banners/');
      return;
    }

    console.log(`✅ Encontrados ${files.length} archivos\n`);

    // Hacer público cada archivo
    for (const file of files) {
      try {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
        console.log(`✅ ${file.name}`);
        console.log(`   URL: ${publicUrl}\n`);
      } catch (error) {
        console.error(`❌ Error con ${file.name}:`, error.message);
      }
    }

    console.log('\n🎉 Proceso completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeBannersPublic()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
