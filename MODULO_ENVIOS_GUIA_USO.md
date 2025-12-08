# 📦 MÓDULO DE ENVÍOS Y GUÍAS DE REMISIÓN - GUÍA DE USO

## ✅ Problemas Corregidos

1. **Error de API 404:** Se corrigió la duplicación de `/v1/` en las URLs
2. **Modal muy pequeño:** Ahora es una página completa con mucho más espacio
3. **Mejor experiencia:** Formulario en página completa con resumen lateral
4. **Ejemplos incluidos:** Panel de guía rápida con datos de ejemplo

---

## 🚀 Cómo Crear una Guía de Remisión

### Paso 1: Acceder al Módulo
- Ir a **Ventas > Procesos > Guías de Remisión** (en el sidebar)
- O acceder directamente a `/shipments`

### Paso 2: Crear Nueva Guía
- Clic en **"Nueva Guía de Remisión"**
- Se abrirá una página completa con todo el formulario

### Paso 3: Llenar Información del Documento
El **número de guía se genera automáticamente** con formato correlativo:
- `GR-0001` (Primera guía)
- `GR-0002` (Segunda guía)
- `GR-0003` y así sucesivamente...

**Ejemplo:**
- Número de Guía: `GR-0025` (generado automáticamente)
- Tipo: Guía de Remisión
- Fecha: 17/11/2025

### Paso 4: Información del Cliente
**Ejemplo:**
```
Cliente: Ferretería El Constructor
Teléfono: 2234-5678
RTN: 0801199012345
```

### Paso 5: RECEPTOR PRINCIPAL (OBLIGATORIO) ⭐
**Persona que va a recibir el paquete:**

**Ejemplo Real:**
```
Nombre: Juan Carlos Pérez Martínez
Teléfono: 9876-5432
Documento: 0801-1990-12345
```

### Paso 6: Receptores Alternativos (Opcional)
**Si Juan Carlos no está, ¿quién puede recibir?**

**Receptor Alternativo 1:**
```
Nombre: María Elena López (esposa)
Teléfono: 9876-5433
Documento: 0801-1992-67890
```

**Receptor Alternativo 2:**
```
Nombre: Pedro Pérez (hermano)
Teléfono: 9876-5434
Documento: 0801-1988-11111
```

### Paso 7: Lugar de Partida (Origen)
**Seleccione una bodega o escriba la dirección:**

**Ejemplo con Bodega:**
```
Bodega: Bodega Central
(Se auto-completa la dirección)
```

**Ejemplo Manual:**
```
Dirección: Col. Kennedy, Blvd. Suyapa, frente a Mall Multiplaza
Ciudad: Tegucigalpa
Departamento: Francisco Morazán
```

### Paso 8: Lugar de Destino
**Dirección COMPLETA de entrega:**

**Ejemplo Real:**
```
Dirección: Barrio La Granja, 2 cuadras al norte del parque central

Referencias del Lugar:
Casa #45, color amarillo con portón azul, de 2 pisos,
frente a pulpería Rosita, al lado de la casa verde

Ciudad: Comayagüela
Departamento: Francisco Morazán
```

**Otro Ejemplo:**
```
Dirección: Col. Miraflores, Calle Principal, casa esquinera

Referencias del Lugar:
Casa de 1 piso, color crema, portón negro,
tiene un árbol de mango enfrente,
diagonal a la Iglesia Católica

Ciudad: San Pedro Sula
Departamento: Cortés
```

### Paso 9: Conductor y Vehículo (Opcional)
**Ejemplo:**
```
Vehículo: (Seleccionar de la lista)
Placa: HJI-1234
Conductor: Carlos Alberto Méndez
Teléfono: 9999-8888
```

### Paso 10: Información Adicional
**Ejemplo:**
```
Fecha Estimada de Entrega: 18/11/2025
Hora de Salida: 08:00 AM
Cantidad de Paquetes: 3

Notas Generales:
"Cliente solicita entrega por la mañana antes de las 10 AM"

Instrucciones Especiales:
"Frágil - Manejar con cuidado. Contiene artículos de vidrio"
```

### Paso 11: Guardar
- Clic en **"Guardar Guía de Remisión"**
- Se creará con estado **PENDIENTE**
- Se generará el número correlativo automático

---

## 📊 Estados de los Envíos

### 1. PENDIENTE (Amarillo)
- Guía creada, esperando salida
- **Acción:** Asignar conductor y vehículo si falta

### 2. EN CAMINO (Azul)
- Envío salió del origen
- **Cómo cambiar:** En la lista, clic en ⋮ > "Marcar En Camino"

### 3. ENTREGADO (Verde)
- Envío completado exitosamente
- **Cómo cambiar:** En la lista, clic en ⋮ > "Marcar Entregado"
- Se registra automáticamente fecha/hora y usuario

### 4. CANCELADO (Rojo)
- Envío cancelado
- Solo se puede cancelar si NO está entregado

---

## 💡 Ejemplos Completos de Guías de Remisión

### Ejemplo 1: Envío Local en Tegucigalpa

```
GUÍA DE REMISIÓN: GR-0015

CLIENTE:
- Nombre: Supermercado La Económica
- Teléfono: 2234-5678
- RTN: 0801201012345

RECEPTOR PRINCIPAL:
- Nombre: José Antonio Flores
- Teléfono: 9876-5432
- Cédula: 0801-1985-54321

RECEPTOR ALTERNATIVO 1:
- Nombre: Ana María Reyes (Encargada)
- Teléfono: 9876-5433

ORIGEN:
- Bodega: Bodega Central
- Dirección: Col. Kennedy, Blvd. Suyapa
- Ciudad: Tegucigalpa

DESTINO:
- Dirección: Barrio Concepción, 3era Avenida,
  entre 8va y 9na calle
- Referencias: Edificio de 3 pisos, color blanco,
  con letrero "Supermercado La Económica" en rojo
- Ciudad: Tegucigalpa

CONDUCTOR:
- Nombre: Mario López
- Placa: HJI-5678
- Teléfono: 9999-7777

PAQUETES: 5 cajas
SALIDA: 08:00 AM
ENTREGA ESTIMADA: Mismo día antes de 12:00 PM

NOTAS:
"Entrega prioritaria - Productos perecederos"
```

### Ejemplo 2: Envío Interdepartamental

```
GUÍA DE REMISIÓN: GR-0016

CLIENTE:
- Nombre: Distribuidora del Norte
- Teléfono: 2550-1234

RECEPTOR PRINCIPAL:
- Nombre: Roberto Carlos Mejía
- Teléfono: 9845-6789

RECEPTOR ALTERNATIVO 1:
- Nombre: Carmen Salgado (Secretaria)
- Teléfono: 9845-6790

RECEPTOR ALTERNATIVO 2:
- Nombre: Luis Hernández (Contador)
- Teléfono: 9845-6791

ORIGEN:
- Dirección: Bodega Principal, Zona Industrial Búfalo,
  Blvd. del Norte, Tegucigalpa
- Ciudad: Tegucigalpa
- Departamento: Francisco Morazán

DESTINO:
- Dirección: Barrio El Benque, 2da Calle,
  entre 3ra y 4ta Avenida
- Referencias: Oficina de 2 pisos, color azul marino,
  con letrero "Distribuidora del Norte",
  a 50 metros del Banco Atlántida
- Ciudad: San Pedro Sula
- Departamento: Cortés

CONDUCTOR:
- Nombre: Fernando Castillo
- Placa: HJI-9012
- Teléfono: 9888-5555

PAQUETES: 10 cajas
SALIDA: 05:00 AM
ENTREGA ESTIMADA: 19/11/2025

INSTRUCCIONES ESPECIALES:
"Llamar al receptor 30 minutos antes de llegar.
Entregar en horario de oficina (8 AM - 5 PM)"
```

### Ejemplo 3: Envío Residencial

```
GUÍA DE REMISIÓN: GR-0017

CLIENTE:
- Nombre: María Fernanda Gómez
- Teléfono: 9765-4321

RECEPTOR PRINCIPAL:
- Nombre: María Fernanda Gómez
- Teléfono: 9765-4321

RECEPTOR ALTERNATIVO 1:
- Nombre: Sofía Gómez (hija)
- Teléfono: 9765-4322

ORIGEN:
- Dirección: Tienda ProsperPOS, Centro Comercial Los Próceres
- Ciudad: Tegucigalpa

DESTINO:
- Dirección: Residencial Las Colinas, Casa #25,
  Bloque C
- Referencias: Casa de 2 pisos, color beige,
  portón café, tiene jardín al frente con rosas,
  tercera casa del lado izquierdo entrando al residencial
- Ciudad: Tegucigalpa
- Departamento: Francisco Morazán

PAQUETES: 1
SALIDA: 02:00 PM
ENTREGA ESTIMADA: Mismo día antes de 6:00 PM

NOTAS:
"Cliente solicita que llamen al llegar al residencial.
No dejar con portero."
```

---

## 🎯 Panel de Resumen Lateral

En la página de creación, verás un **panel lateral sticky** que muestra un resumen en tiempo real:

```
📋 RESUMEN DEL ENVÍO

Número de Guía: GR-0025
━━━━━━━━━━━━━━━━━━━━━━
Cliente: Ferretería El Constructor
Receptor: Juan Carlos Pérez
          9876-5432
━━━━━━━━━━━━━━━━━━━━━━
Origen: Col. Kennedy, Blvd. Suyapa...
Destino: Barrio La Granja, 2 cuadras...
━━━━━━━━━━━━━━━━━━━━━━
Conductor: Carlos Alberto Méndez
Vehículo: HJI-1234
```

---

## 📱 Guía Rápida en Pantalla

También verás una tarjeta con **ejemplos de datos** para ayudarte:

```
💡 GUÍA RÁPIDA

Ejemplo de datos:

• Cliente: Ferretería El Constructor
• Receptor: Juan Pérez - Tel: 9999-9999
• Origen: Bodega Central, Col. Kennedy, Tegucigalpa
• Destino: Barrio La Granja, 2 cuadras al norte
  del parque, casa #45, portón azul
• Referencias: Casa de 2 pisos, portón azul,
  frente a pulpería
```

---

## 🔍 Buscar y Filtrar Envíos

### Búsqueda:
- Por número de guía: `GR-0015`
- Por nombre de cliente: `Supermercado`
- Por receptor: `José Flores`

### Filtros:
- Todos los Estados
- Solo Pendientes
- Solo En Camino
- Solo Entregados
- Solo Cancelados

---

## 🎨 Colores y Badges

- 🟡 **PENDIENTE** - Badge amarillo
- 🔵 **EN CAMINO** - Badge azul
- 🟢 **ENTREGADO** - Badge verde
- 🔴 **CANCELADO** - Badge rojo

---

## ⚠️ Validaciones Importantes

### Campos OBLIGATORIOS (con *):
1. ✅ Número de Guía (auto-generado)
2. ✅ Fecha de Emisión
3. ✅ Nombre del Cliente
4. ✅ Nombre del Receptor Principal
5. ✅ Teléfono del Receptor Principal
6. ✅ Dirección de Origen
7. ✅ Dirección de Destino

### Campos Opcionales pero Recomendados:
- Receptores alternativos (para evitar devoluciones)
- Referencias del lugar (para que el conductor encuentre fácil)
- Conductor y vehículo (para trazabilidad)
- Notas e instrucciones (para comunicaciones especiales)

---

## 🚫 Restricciones

1. **No se puede eliminar** un envío ENTREGADO
2. **No se puede cambiar** el estado de un envío ENTREGADO
3. **El número de guía** no se puede cambiar una vez creado
4. **Los envíos cancelados** solo pueden volver a PENDIENTE

---

## 📍 Acceso Rápido

- **Lista de Envíos:** `/shipments`
- **Crear Guía:** `/shipments/create`
- **Editar Guía:** `/shipments/edit/:id`

---

## ✨ Características de la Nueva Página

1. **Diseño de 2 columnas:**
   - Izquierda: Formulario completo
   - Derecha: Resumen + Guía rápida

2. **Resumen en tiempo real:**
   - Se actualiza mientras escribes
   - Panel sticky (se queda visible al hacer scroll)

3. **Tarjetas organizadas:**
   - Por secciones lógicas
   - Con colores para diferenciar

4. **Botones siempre visibles:**
   - Guardar (arriba y abajo)
   - Volver a la lista

5. **Alertas informativas:**
   - Explican para qué sirve cada sección
   - Ejemplos integrados

---

¡Ahora tienes una página completa profesional para gestionar tus guías de remisión! 🎉

**Carlos Argeñal**
ProsperPOS - 17 de Noviembre de 2025
