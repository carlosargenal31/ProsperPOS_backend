const db = require('./src/utils/database');

async function updateCompanyLogo() {
  try {
    console.log('Actualizando logo de la empresa...\n');

    // URL del logo correcto
    const logoUrl = 'https://storage.googleapis.com/prosperpos-images/categories/category_1.jpg';

    // Actualizar la empresa por defecto
    const result = await db.execute(
      'UPDATE companies SET logo_url = ? WHERE is_default = 1 OR id = 1',
      [logoUrl]
    );

    console.log('Logo actualizado exitosamente!');
    console.log(`Registros afectados: ${result.affectedRows || 'N/A'}`);
    console.log(`Nuevo logo URL: ${logoUrl}`);

    // Verificar
    const companies = await db.execute(
      'SELECT id, name, commercial_name, logo_url FROM companies WHERE is_default = 1 OR id = 1 LIMIT 1'
    );

    if (companies && companies.length > 0) {
      console.log('\nVerificación:');
      console.log(`ID: ${companies[0].id}`);
      console.log(`Nombre: ${companies[0].name}`);
      console.log(`Logo URL: ${companies[0].logo_url}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateCompanyLogo();
