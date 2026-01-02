const BannerService = require('./src/services/banner.service');

(async () => {
  try {
    console.log('🧪 PROBANDO BannerService.getAllBanners()...\n');

    const result = await BannerService.getAllBanners();

    console.log('\n✅ RESULTADO FINAL:');
    console.log('success:', result.success);
    console.log('message:', result.message);
    console.log('data es array?:', Array.isArray(result.data));
    console.log('Cantidad de items:', result.data?.length);
    console.log('\n📋 DATOS COMPLETOS:');
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
})();
