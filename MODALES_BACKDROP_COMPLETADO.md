# Configuración de Modales - Backdrop Estático

## Fecha: 2025-11-25

## Resumen

Se han modificado todos los modales de los módulos solicitados para evitar que se cierren al hacer clic fuera de ellos o al presionar la tecla ESC.

## Cambios Aplicados

Se agregaron los siguientes atributos a todos los modales:
- `data-bs-backdrop="static"` - Evita que el modal se cierre al hacer clic fuera
- `data-bs-keyboard="false"` - Evita que el modal se cierre con la tecla ESC

## Módulos Modificados ✅

### Personas y Lugares

#### 1. **Clientes** ✅
- **Archivo**: `template/src/components/modal/customer-modal.vue`
- **Modales modificados**:
  - Ver Cliente (`#view-customer`)
  - Agregar Cliente (`#add-customer`)
  - Editar Cliente (`#edit-customer`)
  - Eliminar Cliente (`#delete-customer-modal`)

#### 2. **Proveedores** ✅
- **Archivo**: `template/src/components/modal/supplier-modal.vue`
- **Modales modificados**:
  - Ver Proveedor (`#view-supplier`)
  - Agregar Proveedor (`#add-supplier`)
  - Editar Proveedor (`#edit-supplier`)
  - Eliminar Proveedor (`#delete-supplier-modal`)

#### 3. **Sucursales** ✅
- **Archivo**: `template/src/components/modal/branch-modal.vue`
- **Modales modificados**:
  - Ver Sucursal (`#view-branch`)
  - Agregar Sucursal (`#add-branch`)
  - Editar Sucursal (`#edit-branch`)
  - Eliminar Sucursal (`#delete-branch-modal`)

#### 4. **Bodegas** ✅
- **Archivo**: `template/src/components/modal/warehouse-modal.vue`
- **Modales modificados**:
  - Ver Bodega (`#view-warehouse`)
  - Agregar Bodega (`#add-warehouse`)
  - Editar Bodega (`#edit-warehouse`)
  - Eliminar Bodega (`#delete-warehouse-modal`)

#### 5. **Vehículos** ✅
- **Archivo**: `template/src/components/modal/vehicle-modal.vue`
- **Modales modificados**:
  - Ver Vehículo (`#view-vehicle`)
  - Agregar Vehículo (`#add-vehicle`)
  - Editar Vehículo (`#edit-vehicle`)
  - Eliminar Vehículo (`#delete-vehicle-modal`)

### Ubicaciones

#### 6. **Países** ✅
- **Archivo**: `template/src/components/modal/country-modal.vue`
- **Modales modificados**:
  - Ver País (`#view-country`)
  - Agregar País (`#add-country`)
  - Editar País (`#edit-country`)
  - Eliminar País (`#delete-country-modal`)

#### 7. **Departamentos/Estados** ✅
- **Archivo**: `template/src/components/modal/state-modal.vue`
- **Modales modificados**:
  - Ver Departamento (`#view-state`)
  - Agregar Departamento (`#add-state`)
  - Editar Departamento (`#edit-state`)
  - Eliminar Departamento (`#delete-state-modal`)

#### 8. **Ciudades/Municipios** ✅
- **Archivo**: `template/src/components/modal/city-modal.vue`
- **Modales modificados**:
  - Ver Ciudad (`#view-city`)
  - Agregar Ciudad (`#add-city`)
  - Editar Ciudad (`#edit-city`)
  - Eliminar Ciudad (`#delete-city-modal`)

### Gestión de Recursos Humanos

#### 9. **Departamentos (RH)** ✅
- **Archivo**: `template/src/components/modal/department-modal.vue`
- **Modales modificados**:
  - Ver Departamento (`#view-department`)
  - Agregar Departamento (`#add-department`)
  - Editar Departamento (`#edit-department`)
  - Eliminar Departamento (`#delete-department-modal`)

#### 10. **Cargos/Puestos** ✅
- **Archivo**: `template/src/components/modal/position-modal.vue`
- **Modales modificados**:
  - Ver Cargo (`#view-position`)
  - Agregar Cargo (`#add-position`)
  - Editar Cargo (`#edit-position`)
  - Eliminar Cargo (`#delete-position-modal`)

#### 11. **Empleados** ✅
- **Archivo**: `template/src/components/modal/employee-modal.vue`
- **Modales modificados**:
  - Ver Empleado (`#view-employee`)
  - Agregar Empleado (`#add-employee`)
  - Editar Empleado (`#edit-employee`)
  - Eliminar Empleado (`#delete-employee-modal`)

## Comportamiento Actualizado

### Antes:
- ❌ Los modales se cerraban al hacer clic fuera de ellos
- ❌ Los modales se cerraban al presionar ESC
- ❌ Podían perderse datos no guardados accidentalmente

### Después:
- ✅ Los modales NO se cierran al hacer clic fuera
- ✅ Los modales NO se cierran al presionar ESC
- ✅ Solo se pueden cerrar con el botón "Cerrar" o "Cancelar"
- ✅ Previene pérdida accidental de datos

## Ejemplo de Código

### Antes:
```vue
<div class="modal fade" id="add-customer">
```

### Después:
```vue
<div class="modal fade" id="add-customer" data-bs-backdrop="static" data-bs-keyboard="false">
```

## Total de Archivos Modificados: 11

## Total de Modales Modificados: ~44

Cada archivo de modal contiene típicamente 4 modales (ver, agregar, editar, eliminar).

## Conclusión

✅ **Todos los modales de los módulos solicitados han sido configurados con backdrop estático.**

Los usuarios ahora deben cerrar explícitamente los modales usando los botones correspondientes, evitando cierres accidentales y pérdida de datos.
