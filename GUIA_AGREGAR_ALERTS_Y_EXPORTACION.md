# 🔔 Guía: Agregar Alerts y Exportación PDF/Excel a Módulos

Esta guía te muestra cómo agregar notificaciones y exportación a cualquier módulo del sistema.

## ✅ Requisitos Previos

1. **SweetAlert2 ya está configurado** en `main.js` (líneas 13-14 y 359)
2. **Helper de exportación creado** en `src/utils/export-helpers.js`

---

## 📋 Paso 1: Agregar Alerts al Modal

### Archivo: `src/components/modal/[nombre]-modal.vue`

### 1.1 Declarar los eventos emit

```javascript
<script>
import { [nombre]Service } from '@/services/api.service';

export default {
  emits: ['saved', 'deleted'], // ✅ Agregar esta línea
  props: {
    // ... tus props existentes
  },
  // ... resto del código
}
</script>
```

### 1.2 Actualizar método de CREAR

```javascript
async save[Nombre]() {
  this.saving = true;
  this.errorAdd = null;
  this.successAdd = null;

  try {
    await [nombre]Service.create[Nombre](this.formAdd);
    this.successAdd = `El/La [nombre] "${this.formAdd.name}" ha sido creado/a exitosamente`;

    setTimeout(() => {
      this.$emit('saved');
      this.closeModalAdd();
    }, 1500);

  } catch (err) {
    this.errorAdd = err.response?.data?.message || 'Error al crear el/la [nombre]';
  } finally {
    this.saving = false;
  }
},
```

### 1.3 Actualizar método de ACTUALIZAR

```javascript
async update[Nombre]() {
  this.updating = true;
  this.errorEdit = null;
  this.successEdit = null;

  try {
    await [nombre]Service.update[Nombre](this.formEdit.id, this.formEdit);
    this.successEdit = `El/La [nombre] "${this.formEdit.name}" ha sido actualizado/a exitosamente`;

    setTimeout(() => {
      this.$emit('saved');
      this.closeModalEdit();
    }, 1500);

  } catch (err) {
    this.errorEdit = err.response?.data?.message || 'Error al actualizar el/la [nombre]';
  } finally {
    this.updating = false;
  }
},
```

### 1.4 Actualizar método de ELIMINAR

```javascript
async delete[Nombre]() {
  if (!this.[nombre]ToDelete) return;

  this.deleting = true;
  this.deleteError = null;

  try {
    await [nombre]Service.delete[Nombre](this.[nombre]ToDelete.id);

    this.$emit('deleted');
    this.closeModalDelete();

  } catch (err) {
    this.deleteError = err.response?.data?.message || 'Error al eliminar el/la [nombre]';
  } finally {
    this.deleting = false;
  }
},
```

---

## 📊 Paso 2: Agregar Exportación PDF/Excel a la Vista

### Archivo: `src/views/pages/[modulo]/[nombre]-list.vue`

### 2.1 Importar helpers

```javascript
<script>
import { [nombre]Service } from '@/services/api.service';
import { hasPermission } from '@/utils/permissions';
import { exportToPDF, exportToExcel } from '@/utils/export-helpers'; // ✅ Agregar

export default {
  // ... resto del código
}
</script>
```

### 2.2 Actualizar los botones del header

```html
<ul class="table-top-head">
  <li>
    <a data-bs-toggle="tooltip" data-bs-placement="top" title="Descargar PDF" @click="handleExportPDF">
      <img src="@/assets/img/icons/pdf.svg" alt="img" />
    </a>
  </li>
  <li>
    <a data-bs-toggle="tooltip" data-bs-placement="top" title="Descargar Excel" @click="handleExportExcel">
      <img src="@/assets/img/icons/excel.svg" alt="img" />
    </a>
  </li>
  <li>
    <a data-bs-toggle="tooltip" data-bs-placement="top" title="Actualizar" @click="load[Nombres]">
      <i class="ti ti-refresh"></i>
    </a>
  </li>
  <li>
    <a data-bs-toggle="tooltip" data-bs-placement="top" title="Contraer" id="collapse-header" @click="toggleHeader">
      <i class="ti ti-chevron-up"></i>
    </a>
  </li>
</ul>
```

### 2.3 Agregar métodos de exportación

```javascript
methods: {
  // ... métodos existentes

  async handleExportPDF() {
    try {
      if (!this.[nombres] || this.[nombres].length === 0) {
        this.$swal({
          icon: 'warning',
          title: 'Sin datos',
          text: 'No hay [nombres] para exportar',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#ffc107'
        });
        return;
      }

      // ✅ PERSONALIZAR: Definir headers según tu tabla
      const headers = ['Código', 'Nombre', 'Descripción', 'Estado'];

      // ✅ PERSONALIZAR: Mapear datos según tus columnas
      const data = this.[nombres].map(item => [
        item.id,
        item.name,
        item.description || '-',
        item.is_active ? 'Activo' : 'Inactivo'
      ]);

      await exportToPDF({
        title: 'Listado de [Nombres]', // ✅ PERSONALIZAR
        headers,
        data,
        filename: `[nombres]_${new Date().toISOString().split('T')[0]}`
      });

      this.$swal({
        icon: 'success',
        title: '¡PDF Generado!',
        text: 'El archivo PDF se ha descargado exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#28a745',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.$swal({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el PDF. Intenta nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
    }
  },

  async handleExportExcel() {
    try {
      if (!this.[nombres] || this.[nombres].length === 0) {
        this.$swal({
          icon: 'warning',
          title: 'Sin datos',
          text: 'No hay [nombres] para exportar',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#ffc107'
        });
        return;
      }

      // ✅ PERSONALIZAR: Definir headers según tu tabla
      const headers = ['Código', 'Nombre', 'Descripción', 'Estado'];

      // ✅ PERSONALIZAR: Mapear datos según tus columnas
      const data = this.[nombres].map(item => [
        item.id,
        item.name,
        item.description || '-',
        item.is_active ? 'Activo' : 'Inactivo'
      ]);

      await exportToExcel({
        title: 'Listado de [Nombres]', // ✅ PERSONALIZAR
        headers,
        data,
        filename: `[nombres]_${new Date().toISOString().split('T')[0]}`
      });

      this.$swal({
        icon: 'success',
        title: '¡Excel Generado!',
        text: 'El archivo Excel se ha descargado exitosamente',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#28a745',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      this.$swal({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el Excel. Intenta nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
    }
  }
}
```

---

## 📝 Ejemplo Completo: Categorías

### Modal: `category-list-modal.vue`

```javascript
export default {
  emits: ['saved', 'deleted'],
  // ... resto igual a las marcas
}
```

### Vista: `category-list.vue`

```javascript
import { exportToPDF, exportToExcel } from '@/utils/export-helpers';

// ... en methods:
async handleExportPDF() {
  // Mismo código que marcas, solo cambiar:
  const headers = ['Código', 'Categoría', 'Productos', 'Estado'];
  const data = this.categories.map(cat => [
    cat.id,
    cat.name,
    cat.products_count || 0,
    cat.is_active ? 'Activo' : 'Inactivo'
  ]);

  await exportToPDF({
    title: 'Listado de Categorías',
    headers,
    data,
    filename: `categorias_${new Date().toISOString().split('T')[0]}`
  });

  // ... resto del alert de éxito
}
```

---

## 🎯 Módulos Prioritarios a Actualizar

### Inventario
- ✅ Marcas (YA HECHO)
- ⬜ Categorías
- ⬜ Subcategorías
- ⬜ Productos
- ⬜ Unidades

### Personas
- ⬜ Clientes
- ⬜ Proveedores
- ⬜ Sucursales
- ⬜ Bodegas

### RH
- ⬜ Empleados
- ⬜ Vehículos
- ⬜ Departamentos
- ⬜ Cargos

### Configuración
- ⬜ Usuarios
- ⬜ Roles
- ⬜ Resoluciones
- ⬜ Cuentas Bancarias
- ⬜ Tasas de Impuesto
- ⬜ Monedas
- ⬜ Tipos Beneficiarios

### Ventas
- ⬜ Cupones
- ⬜ Ofertas

---

## 🔧 Personalización por Módulo

Cada módulo solo necesita cambiar:

1. **Headers de la tabla** (array de strings)
2. **Mapeo de datos** (función map)
3. **Título del reporte**
4. **Nombre del archivo**
5. **Textos de los mensajes**

---

## ✨ Resultado Final

Cuando termines, cada módulo tendrá:

✅ Alerts verdes para crear/actualizar (dentro del modal, se cierran automáticamente)
✅ Alerts rojos para errores (dentro del modal, quedan abiertos)
❌ Sin alerts para eliminar (modal se cierra directamente)
📊 Botones PDF/Excel funcionales con alerts de éxito/error
🏢 PDFs y Excel con información de la empresa incluida

---

## 💡 Tips

- Todos los módulos usan el **mismo patrón**
- Solo cambian los **nombres y columnas**
- Los alerts son **pequeños y discretos** (Bootstrap alerts dentro del modal)
- Las exportaciones muestran **SweetAlert2** solo para confirmación de descarga
- El helper `export-helpers.js` ya maneja toda la lógica de generación

---

¡Listo! Con esta guía puedes actualizar todos los módulos rápidamente. 🚀
