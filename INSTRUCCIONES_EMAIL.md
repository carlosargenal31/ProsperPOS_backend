# 📧 CONFIGURACIÓN DE EMAIL - PASO A PASO

## 🔐 Paso 1: Obtener Contraseña de Aplicación de Google

### Opción A: Si ya tienes verificación en 2 pasos activada

1. Ve a: https://myaccount.google.com/apppasswords
2. Inicia sesión con tu cuenta: **gamaboy3101@gmail.com**
3. En "Selecciona la app", elige: **Correo**
4. En "Selecciona el dispositivo", elige: **Otro (nombre personalizado)**
5. Escribe: **ProsperPOS**
6. Haz clic en **Generar**
7. Copia la contraseña de 16 caracteres que aparece (ejemplo: `abcd efgh ijkl mnop`)
8. **IMPORTANTE:** Copia la contraseña sin espacios: `abcdefghijklmnop`

### Opción B: Si NO tienes verificación en 2 pasos

1. Ve a: https://myaccount.google.com/security
2. En "Iniciar sesión en Google", busca **Verificación en dos pasos**
3. Haz clic en **Empezar**
4. Sigue las instrucciones (te pedirá tu número de teléfono)
5. Una vez activada, ve a: https://myaccount.google.com/apppasswords
6. Sigue los pasos de la Opción A

---

## ⚙️ Paso 2: Configurar en ProsperPOS

Una vez que tengas la contraseña de aplicación (16 caracteres), dímela y yo la configuraré automáticamente.

---

## 🧪 Paso 3: Probar el Envío

Una vez configurado, probaremos enviando un email de prueba a tu correo.

---

## ❓ Problemas Comunes

### "No veo la opción de Contraseñas de aplicaciones"
- Debes activar primero la verificación en 2 pasos

### "El email no llega"
- Revisa tu carpeta de Spam
- Verifica que el email sea correcto
- Asegúrate de que la contraseña de app no tenga espacios

### "Error de autenticación"
- La contraseña de app debe ser de 16 caracteres sin espacios
- No uses tu contraseña normal de Gmail, debe ser la contraseña de aplicación

---

## 📝 ALTERNATIVA: Usar otro servicio de email

Si no quieres usar Gmail, puedes usar cualquier servicio SMTP como:
- **Outlook/Hotmail**: smtp-mail.outlook.com (puerto 587)
- **Yahoo**: smtp.mail.yahoo.com (puerto 587)
- **SendGrid**: smtp.sendgrid.net (puerto 587)
- **Mailgun**: smtp.mailgun.org (puerto 587)

