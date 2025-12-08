const db = require('../src/utils/database');

async function insertCompanyData() {
  try {
    console.log('Insertando datos de la empresa...\n');

    // Verificar si ya existe configuración
    const existing = await db.query('SELECT * FROM billing_settings WHERE id = 1');

    if (existing.length > 0) {
      // Actualizar
      await db.query(`
        UPDATE billing_settings SET
          company_name = ?,
          commercial_name = ?,
          company_rtn = ?,
          company_address = ?,
          company_phone = ?,
          company_email = ?,
          facebook = ?,
          instagram = ?,
          twitter = ?,
          whatsapp = ?,
          country = ?,
          state = ?,
          city = ?,
          invoice_footer_text = ?,
          company_logo_path = ?
        WHERE id = 1
      `, [
        'CERAMICAS TERRAZOS Y PULIDOS UNIVERSAL',
        'Ceramicas Terrazos y Pulidos Universal',
        '01061977002516',
        'Casa Matriz, Barrio La Merced, Avenida 14 de Julio entre 15 y 16 calle frente a Repuestos del Atlántico. La Ceiba, Atlántida',
        '+504 2440-0037',
        'mauricio_argenal@hotmail.com',
        'Ceramicasuniversalhn.com',
        'Ceramicasuniversalhn.com',
        'Ceramicasuniversalhn',
        '+504 9875-2725',
        'Honduras',
        'Atlántida',
        'La Ceiba',
        'Original: Cliente/Copia: Obligado Tributario Emisor. ¡La Factura es beneficio de todos Exíjala!',
        '/img/logo_ceramicasuniversal.png'
      ]);

      console.log('✓ Datos de la empresa actualizados exitosamente');
    } else {
      // Insertar
      await db.query(`
        INSERT INTO billing_settings (
          company_name, commercial_name, company_rtn, company_address,
          company_phone, company_email, facebook, instagram, twitter, whatsapp,
          country, state, city, invoice_footer_text, company_logo_path,
          invoice_prefix, last_invoice_number, invoice_number_length,
          credit_note_prefix, default_payment_terms, default_tax_rate,
          default_currency, show_company_logo, show_tax_breakdown
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'CERAMICAS TERRAZOS Y PULIDOS UNIVERSAL',
        'Ceramicas Terrazos y Pulidos Universal',
        '01061977002516',
        'Casa Matriz, Barrio La Merced, Avenida 14 de Julio entre 15 y 16 calle frente a Repuestos del Atlántico. La Ceiba, Atlántida',
        '+504 2440-0037',
        'mauricio_argenal@hotmail.com',
        'Ceramicasuniversalhn.com',
        'Ceramicasuniversalhn.com',
        'Ceramicasuniversalhn',
        '+504 9875-2725',
        'Honduras',
        'Atlántida',
        'La Ceiba',
        'Original: Cliente/Copia: Obligado Tributario Emisor. ¡La Factura es beneficio de todos Exíjala!',
        '/img/logo_ceramicasuniversal.png',
        '000-002-01',
        31792,
        8,
        'NC',
        30,
        15.00,
        'HNL',
        1,
        1
      ]);

      console.log('✓ Datos de la empresa insertados exitosamente');
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

insertCompanyData();
