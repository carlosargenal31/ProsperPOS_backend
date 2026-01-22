const axios = require('axios');

async function verifyGmailSetup() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   VERIFICACIÓN DE CONFIGURACIÓN DE GMAIL');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📧 Cuenta a verificar: gamaboy3101@gmail.com\n');

  console.log('Por favor verifica los siguientes puntos:\n');

  console.log('1️⃣ VERIFICACIÓN EN DOS PASOS');
  console.log('   ¿Está activada?');
  console.log('   👉 Ve a: https://myaccount.google.com/security');
  console.log('   👉 Busca "Verificación en dos pasos"');
  console.log('   👉 Debe decir "Activada" ✅\n');

  console.log('2️⃣ CONTRASEÑAS DE APLICACIONES');
  console.log('   ¿Puedes acceder a esta página?');
  console.log('   👉 Ve a: https://myaccount.google.com/apppasswords');
  console.log('   👉 Si te dice "Esta configuración no está disponible", necesitas activar la verificación en 2 pasos primero\n');

  console.log('3️⃣ ACCESO DE APLICACIONES MENOS SEGURAS');
  console.log('   Esta opción YA NO se usa (está obsoleta)');
  console.log('   👉 Debes usar CONTRASEÑAS DE APLICACIÓN (no esta opción)\n');

  console.log('4️⃣ CREAR CONTRASEÑA DE APLICACIÓN CORRECTAMENTE');
  console.log('   Paso a paso:');
  console.log('   a) Ve a: https://myaccount.google.com/apppasswords');
  console.log('   b) Haz clic en "Seleccionar app" → Elige "Correo"');
  console.log('   c) Haz clic en "Seleccionar dispositivo" → Elige "Otro"');
  console.log('   d) Escribe: ProsperPOS');
  console.log('   e) Haz clic en "Generar"');
  console.log('   f) Copia los 16 caracteres (pueden tener espacios, está bien)\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('⚠️  POSIBLES CAUSAS DEL ERROR:\n');

  console.log('❌ Causa 1: Verificación en 2 pasos NO activada');
  console.log('   → Solución: Activar verificación en 2 pasos primero\n');

  console.log('❌ Causa 2: Contraseña incorrecta o copiada mal');
  console.log('   → Solución: Eliminar la contraseña anterior y crear una NUEVA\n');

  console.log('❌ Causa 3: Cuenta con restricciones de seguridad');
  console.log('   → Solución: Verificar que no haya alertas de seguridad en tu cuenta\n');

  console.log('❌ Causa 4: Contraseña revocada o expirada');
  console.log('   → Solución: Crear una nueva contraseña de aplicación\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 INSTRUCCIONES DETALLADAS:\n');

  console.log('PASO 1: Verifica que la verificación en 2 pasos esté activada');
  console.log('   https://myaccount.google.com/security\n');

  console.log('PASO 2: Ve a contraseñas de aplicación');
  console.log('   https://myaccount.google.com/apppasswords\n');

  console.log('PASO 3: ELIMINA todas las contraseñas anteriores que digan "ProsperPOS"\n');

  console.log('PASO 4: CREA UNA NUEVA contraseña de aplicación');
  console.log('   - Nombre: ProsperPOS');
  console.log('   - Tipo: Correo / Otro\n');

  console.log('PASO 5: COPIA la contraseña COMPLETA (16 caracteres)');
  console.log('   Ejemplo: abcd efgh ijkl mnop\n');

  console.log('PASO 6: Pegámela aquí en el chat exactamente como la ves\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('💡 ALTERNATIVA: Usar otro servicio de email\n');
  console.log('Si Gmail sigue dando problemas, podemos usar:');
  console.log('   • Outlook/Hotmail (smtp-mail.outlook.com)');
  console.log('   • SendGrid (servicio gratuito para envío de emails)');
  console.log('   • Mailgun (servicio gratuito para envío de emails)\n');

  console.log('═══════════════════════════════════════════════════════════════\n');
}

verifyGmailSetup();
