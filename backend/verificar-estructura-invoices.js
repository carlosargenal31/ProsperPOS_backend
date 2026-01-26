const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificar() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosper_pos'
    });

    console.log('✓ Conectado a MySQL\n');

    // Ver todas las columnas de invoices
    const [columns] = await connection.query('SHOW COLUMNS FROM invoices');

    console.log('=== COLUMNAS DE LA TABLA INVOICES ===\n');
    console.log('Total de columnas:', columns.length);
    console.log('');

    // Buscar los campos adicionales
    const camposAdicionales = columns.filter(col =>
      ['orden_compra', 'constancia_exonerado', 'registro_sag'].includes(col.Field)
    );

    console.log('CAMPOS ADICIONALES:');
    if (camposAdicionales.length === 3) {
      console.log('✅ Los 3 campos existen:');
      camposAdicionales.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} (${col.Null})`);
      });
    } else {
      console.log(`❌ Solo ${camposAdicionales.length} de 3 campos existen`);
      camposAdicionales.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type}`);
      });
    }

    console.log('\n=== TODAS LAS COLUMNAS ===\n');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} (${col.Type})`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

verificar();
