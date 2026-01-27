# 🔍 Cómo Depurar el Sidebar del Vendedor

## ✅ Cambios Aplicados

He agregado **logs de depuración extensivos** que te mostrarán **exactamente** qué está pasando con el filtrado del sidebar.

---

## 🚀 Pasos para Depurar

### PASO 1: Reiniciar el Frontend

```bash
cd template
# Detener con Ctrl + C si está corriendo
npm run dev
```

**Espera a que diga:**
```
✓ Local: http://localhost:3001
```

---

### PASO 2: Limpiar Caché del Navegador

1. Ve a `http://localhost:3001`
2. Presiona **Ctrl + Shift + R** (fuerza recarga)

---

### PASO 3: Cerrar Sesión

Si estás logueado, cierra sesión:
- Opción A: Usa el botón "Cerrar Sesión" del menú
- Opción B: En consola (F12): `localStorage.clear(); location.reload();`

---

### PASO 4: Iniciar Sesión con Vendedor

```
Usuario: vendedor
Contraseña: [tu contraseña]
```

---

### PASO 5: Abrir la Consola del Navegador

1. Presiona **F12**
2. Ve a la pestaña **Console**
3. Verás logs como estos:

---

## 📊 Logs que Verás (Ejemplo Correcto)

Si todo está funcionando bien, deberías ver esto en la consola:

```
========================================
FILTERING SIDEBAR FOR ROLES: ["cashier"]
========================================

[canViewSection] "Centro de Control": Cashier - false
[canViewSection] "Ventas": Cashier - true
[canViewSection] "Inventario": Cashier - true
[canViewSection] "Compras": Cashier - false
[canViewSection] "Personas y Lugares": Cashier - false
[canViewSection] "Gestión de Recursos Humanos": Cashier - false
[canViewSection] "Reportes": Cashier - false
[canViewSection] "Tienda en Línea": Cashier - false
[canViewSection] "Gestión de Usuarios": Cashier - true
[canViewSection] "Ajustes": Cashier - true
[canViewSection] "Ayuda": Cashier - true

[canViewSubmenuItem] "Ventas" > "Archivos" > "Cupones": Cashier - true
  - submenuItems: ["Cupones", "Ofertas"]
[canViewSubmenuItem] "Ventas" > "Archivos" > "Ofertas": Cashier - true
  - submenuItems: ["Cupones", "Ofertas"]
[canViewSubmenuItem] "Ventas" > "Procesos" > "POS Facturación": Cashier - true
  - submenuItems: ["POS Facturación", "Devoluciones Ventas", "Guías de Remisión"]
... (más items)

========================================
FILTERED SIDEBAR RESULT:
  Total sections: 5
  - Ventas (3 menus)
    - Archivos (2 items)
    - Procesos (3 items)
    - Reportes (3 items)
  - Inventario (2 menus)
    - Archivos (2 items)
    - Reportes (2 items)
  - Gestión de Usuarios (1 menus)
    - Cerrar Sesión
  - Ajustes (1 menus)
    - Ajustes Generales (1 items)
  - Ayuda (1 menus)
    - Manual Vendedor
========================================
```

**Si ves esto, el sidebar DEBERÍA aparecer!**

---

## ❌ Problemas Comunes

### Problema 1: Roles Vacíos

**Log que verás:**
```
FILTERING SIDEBAR FOR ROLES: []
```

**Causa:** El usuario no tiene roles.

**Solución:**
1. Cierra sesión
2. Asegúrate de que el backend esté corriendo
3. Inicia sesión de nuevo

---

### Problema 2: Nombres en lugar de Slugs

**Log que verás:**
```
FILTERING SIDEBAR FOR ROLES: ["Vendedor"]
[canViewSection] No matching role - FALSE
```

**Causa:** El backend está enviando nombres ("Vendedor") en lugar de slugs ("cashier").

**Solución:**
1. **Reinicia el backend:**
   ```bash
   cd backend
   npm start
   ```
2. Cierra sesión en el frontend
3. Inicia sesión de nuevo

---

### Problema 3: Total Sections = 0

**Log que verás:**
```
FILTERED SIDEBAR RESULT:
  Total sections: 0
```

**Causa:** Ninguna sección pasó el filtro.

**Diagnóstico:**
Busca en los logs las líneas `[canViewSection]`. Si todas dicen `false`, verifica:

1. **Roles correctos:**
   ```javascript
   // En consola (F12)
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('Roles:', user.roles);
   // Debe mostrar: ["cashier"]
   ```

2. **Archivo sidebar-permissions.js cargado:**
   Busca errores en la consola que digan algo como:
   ```
   Failed to load module @/utils/sidebar-permissions
   ```

---

### Problema 4: Secciones OK pero Menús = 0

**Log que verás:**
```
FILTERED SIDEBAR RESULT:
  Total sections: 5
  - Ventas (0 menus)    ← PROBLEMA
  - Inventario (0 menus) ← PROBLEMA
```

**Causa:** Los submenús están siendo filtrados completamente.

**Diagnóstico:**
Busca líneas `[canViewSubmenuItem]`. Deberías ver algo como:

```
[canViewSubmenuItem] "Ventas" > "Archivos" > "Cupones": Cashier - true
```

Si todas dicen `false`, verifica que los nombres coincidan exactamente entre:
- `sidebar.json` (menuValue, subMenu.menuValue)
- `sidebar-permissions.js` (cashier_submenus)

---

## 🔧 Herramienta de Diagnóstico

He creado un archivo HTML que te ayudará a depurar:

**Archivo:** `DEBUG_SIDEBAR_VENDEDOR.html`

**Cómo usarlo:**
1. Haz doble clic en el archivo
2. Se abrirá en tu navegador
3. Sigue las instrucciones paso a paso

---

## 📝 Script de Diagnóstico Rápido

Copia y pega esto en la consola (F12) cuando estés logueado como vendedor:

```javascript
// Diagnóstico completo del sidebar
const user = JSON.parse(localStorage.getItem('user'));
console.log('=== DIAGNÓSTICO COMPLETO ===');
console.log('');
console.log('1. Usuario:', user?.username);
console.log('2. Roles:', user?.roles);
console.log('3. Tipo de roles:', typeof user?.roles);
console.log('4. Es array?:', Array.isArray(user?.roles));
console.log('');

if (user?.roles) {
    console.log('Verificando permisos de cada rol:');
    user.roles.forEach(role => {
        console.log(`  - Rol: "${role}"`);
        console.log(`    Es cashier?: ${role === 'cashier'}`);
        console.log(`    Es warehouse?: ${role === 'warehouse'}`);
        console.log(`    Es admin?: ${role === 'admin'}`);
    });
} else {
    console.error('❌ No hay roles en el usuario!');
}

console.log('');
console.log('=== FIN DIAGNÓSTICO ===');
```

---

## 📋 Checklist de Verificación

Antes de reportar un error, verifica que:

- [ ] Backend está corriendo (`http://localhost:3000/health` responde)
- [ ] Frontend está corriendo (`http://localhost:3001` carga)
- [ ] Caché limpiado con Ctrl + Shift + R
- [ ] Sesión cerrada y reiniciada
- [ ] Usuario vendedor usado para login
- [ ] Consola (F12) abierta
- [ ] Logs aparecen en consola
- [ ] `FILTERING SIDEBAR FOR ROLES: ["cashier"]` aparece
- [ ] `Total sections:` muestra un número > 0
- [ ] Cada sección tiene al menos 1 menu

---

## 🎯 Qué Hacer con los Logs

Una vez que tengas los logs:

### Si "Total sections: 0"
1. Busca `[canViewSection]` en los logs
2. Identifica qué secciones deberían ser `true` para cashier:
   - Ventas: true
   - Inventario: true
   - Gestión de Usuarios: true
   - Ajustes: true
   - Ayuda: true
3. Si alguna dice `false` cuando debería ser `true`, hay un problema de configuración

### Si "Total sections: > 0" pero "(0 menus)"
1. Busca `[canViewSubmenuItem]` en los logs
2. Verifica que los nombres coincidan exactamente
3. Ejemplo esperado:
   ```
   [canViewSubmenuItem] "Ventas" > "Archivos" > "Cupones": Cashier - true
   ```

### Si todo se ve correcto pero el sidebar no aparece
1. Puede ser un problema de CSS
2. Verifica en el inspector (F12 → Elements) si el elemento `<ul>` del sidebar existe en el DOM
3. Si existe pero no se ve, puede ser un problema de `display: none` o `visibility: hidden`

---

## 💡 Tips Importantes

1. **Siempre cierra sesión antes de probar:**
   - Los cambios de permisos requieren un nuevo login

2. **Limpia caché después de cambios:**
   - Ctrl + Shift + R después de cualquier cambio en el código

3. **Reinicia backend si cambiaste auth.service.js:**
   - El backend cachea la configuración de base de datos

4. **Lee los logs con calma:**
   - Los logs están diseñados para ser descriptivos
   - Busca palabras clave como "false", "No", "No matching"

---

## 📞 Siguiente Paso

**Después de revisar los logs:**

1. Si encuentras un problema específico, busca la solución arriba
2. Si todo parece correcto pero el sidebar no aparece, comparte los logs completos
3. Si hay un error que no está documentado aquí, copia el error exacto

---

**Archivos de Ayuda:**
- `DEBUG_SIDEBAR_VENDEDOR.html` - Herramienta visual de diagnóstico
- `CORRECCION_VENDEDOR_POS.md` - Documentación de los cambios aplicados
- `INSTRUCCIONES_PRUEBA_MANUALES_POR_ROL.md` - Guía completa de pruebas

---

**Fecha:** 2026-01-23
**Versión:** 2.0 - Con Logs de Depuración
