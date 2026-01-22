const db = require('./src/utils/database');

async function checkCompanyLogo() {
  try {
    console.log('Consultando información de la empresa...\n');

    const companies = await db.execute(
      'SELECT id, name, commercial_name, logo_url, is_default FROM companies WHERE deleted_at IS NULL ORDER BY is_default DESC LIMIT 5'
    );

    if (companies && companies.length > 0) {
      console.log('Empresas encontradas:');
      companies.forEach((company, index) => {
        console.log(`\n${index + 1}. Empresa ID: ${company.id}`);
        console.log(`   Nombre: ${company.name}`);
        console.log(`   Nombre Comercial: ${company.commercial_name || 'N/A'}`);
        console.log(`   Logo URL: ${company.logo_url || 'NO CONFIGURADO'}`);
        console.log(`   Es default: ${company.is_default ? 'SÍ' : 'NO'}`);
      });
    } else {
      console.log('No se encontraron empresas');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCompanyLogo();
