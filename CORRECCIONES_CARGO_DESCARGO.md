# Correcciones Necesarias para Cargo/Descargo

## Problemas Encontrados

1. ❌ **Error en consulta SQL** - Filtros de fecha causan error cuando están vacíos
2. ❌ **Bodegas no se cargan** - No se está llamando al endpoint de warehouses
3. ❌ **Emisor no se auto-llena** - Debe usar el usuario actual del sessionStorage
4. ❌ **Fecha incorrecta** - Está usando UTC en lugar de zona horaria de Honduras (GMT-6)
5. ❌ **Modal de productos simple** - Debe usar el sistema de búsqueda como cupones

## Correcciones Aplicadas

### 1. Backend - Modelo (✅ CORREGIDO)

**Archivo**: `backend/src/models/cargo-descargo.model.js`

**Cambio**: Agregadas validaciones para evitar que filtros vacíos causen errores

```javascript
// Antes:
if (filters.date_from) {
  query += ` AND cd.registration_date >= ?`;
  params.push(filters.date_from);
}

// Después:
if (filters.date_from && filters.date_from !== '') {
  query += ` AND cd.registration_date >= ?`;
  params.push(filters.date_from);
}
```

### 2. Frontend - Correcciones Pendientes

Los siguientes cambios deben aplicarse en `template/src/views/pages/inventory/cargo-descargo-list.vue`:

#### A. Función para fecha de Honduras

```javascript
// Agregar en methods:
getHondurasDate() {
  const now = new Date();
  // Honduras está en GMT-6
  const hondurasOffset = -6 * 60; // en minutos
  const localOffset = now.getTimezoneOffset();
  const diff = localOffset - hondurasOffset;

  const hondurasTime = new Date(now.getTime() - (diff * 60 * 1000));
  return hondurasTime.toISOString().split('T')[0];
},
```

#### B. Inicialización correcta del formulario

```javascript
// En data(), cambiar:
form: {
  document_type: 'CARGO',
  movement_type: 'ENTRADA',
  warehouse_id: null,
  warehouse_to_id: null,
  issuer: '', // ← Este debe llenarse automáticamente
  concept: '',
  registration_date: new Date().toISOString().split('T')[0] // ← Cambiar esto
}

// A:
form: {
  document_type: 'CARGO',
  movement_type: 'ENTRADA',
  warehouse_id: null,
  warehouse_to_id: null,
  issuer: this.getCurrentUserName(), // ← Auto-llenar
  concept: '',
  registration_date: this.getHondurasDate() // ← Usar zona horaria de Honduras
}
```

#### C. Método para obtener usuario actual

```javascript
// Agregar en methods:
getCurrentUserName() {
  try {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Usuario';
    }
  } catch (e) {
    console.error('Error getting user:', e);
  }
  return 'Usuario';
},
```

#### D. Cargar warehouses en mounted

```javascript
// En mounted(), agregar:
async mounted() {
  await this.loadWarehouses(); // ← Agregar esta línea
  await this.loadDocuments();
},

// Agregar en methods:
async loadWarehouses() {
  try {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`${API_URL}/warehouses`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      this.warehouses = response.data.data || [];
    }
  } catch (error) {
    console.error('Error loading warehouses:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las bodegas'
    });
  }
},
```

#### E. Modal de productos (similar a cupones)

El modal actual es demasiado simple. Debe implementarse un sistema completo con:

1. **Búsqueda por categoría, subcategoría y producto**
2. **Tabla con paginación**
3. **Selección múltiple de productos**
4. **Filtros inline**

**Estructura requerida**:

```html
<!-- BÚSQUEDA DE PRODUCTOS (INLINE) -->
<div v-if="showProductSearch" class="card border-success mb-3">
  <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
    <h6 class="mb-0">Seleccionar Productos</h6>
    <button type="button" class="btn-close btn-close-white" @click="showProductSearch = false"></button>
  </div>
  <div class="card-body">
    <!-- Opciones de búsqueda -->
    <div class="row mb-3">
      <div class="col-md-4">
        <button class="btn btn-sm btn-outline-primary w-100" @click="showCategorySearch = true">
          <i class="ti ti-category"></i> Buscar por Categoría
        </button>
      </div>
      <div class="col-md-4">
        <button class="btn btn-sm btn-outline-info w-100" @click="showSubcategorySearch = true">
          <i class="ti ti-list"></i> Buscar por Subcategoría
        </button>
      </div>
      <div class="col-md-4">
        <button class="btn btn-sm btn-outline-success w-100" @click="showProductSearchDirect = true">
          <i class="ti ti-box"></i> Buscar Producto Directo
        </button>
      </div>
    </div>

    <!-- Búsqueda directa de productos -->
    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label">Buscar por:</label>
        <select class="form-select form-select-sm" v-model="productSearchBy">
          <option value="nombre">Nombre</option>
          <option value="codigo">Código</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Buscar:</label>
        <div class="input-group input-group-sm">
          <input
            type="text"
            class="form-control"
            v-model="productSearchTerm"
            placeholder="Buscar..."
            @keyup.enter="searchProducts"
          />
          <button class="btn btn-success" type="button" @click="searchProducts">
            <i class="ti ti-search"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla de resultados -->
    <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
      <table class="table table-sm table-hover">
        <thead class="table-light" style="position: sticky; top: 0;">
          <tr>
            <th width="50">
              <input type="checkbox" @change="toggleSelectAll" v-model="selectAll" />
            </th>
            <th>Código</th>
            <th>Producto</th>
            <th>Stock</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredProductsForSelection.length === 0">
            <td colspan="5" class="text-center">No se encontraron productos</td>
          </tr>
          <tr
            v-for="product in filteredProductsForSelection"
            :key="product.id"
            @click="toggleProductSelection(product)"
            style="cursor: pointer;"
            :class="{ 'table-active': isProductSelected(product.id) }"
          >
            <td>
              <input
                type="checkbox"
                :checked="isProductSelected(product.id)"
                @click.stop
                @change="toggleProductSelection(product)"
              />
            </td>
            <td>{{ product.code }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.stock || 0 }}</td>
            <td>{{ formatMoney(product.price) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Botón para agregar productos seleccionados -->
    <div class="mt-3 text-end">
      <button
        class="btn btn-success"
        @click="addSelectedProductsToDocument"
        :disabled="selectedProductsIds.length === 0"
      >
        <i class="ti ti-check"></i>
        Agregar {{ selectedProductsIds.length }} producto(s)
      </button>
    </div>
  </div>
</div>
```

**Métodos requeridos**:

```javascript
// En data():
showProductSearch: false,
productSearchBy: 'nombre',
productSearchTerm: '',
filteredProductsForSelection: [],
selectedProductsIds: [],
selectAll: false,
allProducts: [],

// En methods:
async loadAllProducts() {
  try {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`${API_URL}/products?limit=1000`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      this.allProducts = response.data.data || [];
      this.filteredProductsForSelection = this.allProducts;
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
},

searchProducts() {
  if (!this.productSearchTerm) {
    this.filteredProductsForSelection = this.allProducts;
    return;
  }

  const term = this.productSearchTerm.toLowerCase();
  this.filteredProductsForSelection = this.allProducts.filter(product => {
    if (this.productSearchBy === 'nombre') {
      return product.name?.toLowerCase().includes(term);
    } else {
      return product.code?.toLowerCase().includes(term);
    }
  });
},

toggleProductSelection(product) {
  const index = this.selectedProductsIds.indexOf(product.id);
  if (index > -1) {
    this.selectedProductsIds.splice(index, 1);
  } else {
    this.selectedProductsIds.push(product.id);
  }
},

isProductSelected(productId) {
  return this.selectedProductsIds.includes(productId);
},

toggleSelectAll() {
  if (this.selectAll) {
    this.selectedProductsIds = this.filteredProductsForSelection.map(p => p.id);
  } else {
    this.selectedProductsIds = [];
  }
},

addSelectedProductsToDocument() {
  // Agregar productos seleccionados al documento
  this.selectedProductsIds.forEach(id => {
    const product = this.allProducts.find(p => p.id === id);
    if (product && !this.selectedProducts.find(p => p.product_id === id)) {
      this.selectedProducts.push({
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        quantity: 1,
        unit_cost: product.cost || 0,
        total_cost: product.cost || 0,
        current_stock: product.stock || 0,
        warehouse_location: '',
        sub_warehouse: '',
        notes: ''
      });
    }
  });

  // Limpiar selección
  this.selectedProductsIds = [];
  this.selectAll = false;
  this.showProductSearch = false;

  Swal.fire({
    icon: 'success',
    title: 'Productos agregados',
    timer: 1500,
    showConfirmButton: false
  });
},
```

## Resumen de Correcciones

### ✅ Backend
- [x] Modelo: Validación de filtros vacíos

### ⏳ Frontend (Pendientes)
- [ ] Función para obtener fecha de Honduras
- [ ] Auto-llenar emisor con usuario actual
- [ ] Cargar bodegas en mounted
- [ ] Implementar modal de productos completo con:
  - [ ] Búsqueda por categoría/subcategoría
  - [ ] Tabla con paginación
  - [ ] Selección múltiple
  - [ ] Filtros inline
  - [ ] Botón "Agregar productos"

## Instrucciones

1. Aplicar las correcciones del backend (ya aplicadas)
2. Modificar el frontend según las indicaciones
3. Probar cada funcionalidad:
   - Verificar que las bodegas se cargan
   - Verificar que el emisor se auto-llena
   - Verificar que la fecha es correcta (debe ser 06, no 07)
   - Verificar que el modal de productos funciona como el de cupones

## Archivos Afectados

- ✅ `backend/src/models/cargo-descargo.model.js`
- ⏳ `template/src/views/pages/inventory/cargo-descargo-list.vue`
