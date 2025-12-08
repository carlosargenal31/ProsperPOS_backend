const fs = require('fs');
const path = require('path');

// Configuración de archivos a actualizar
const filesToUpdate = [
  {
    path: 'template/src/views/pages/branch/branches.vue',
    name: 'Sucursales',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Ciudad', dataKey: 'city_name' },
      { header: 'Departamento', dataKey: 'state_name' },
      { header: 'Gerente', dataKey: 'gerente' },
      { header: 'Teléfono', dataKey: 'telefono' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedBranches',
    filename: 'sucursales',
    title: 'Lista de Sucursales'
  },
  {
    path: 'template/src/views/pages/people/pos-warehouse.vue',
    name: 'Bodegas',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Encargado', dataKey: 'encargado' },
      { header: 'Ubicación', dataKey: 'ubicacion' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'warehouses',
    filename: 'bodegas',
    title: 'Lista de Bodegas'
  },
  {
    path: 'template/src/views/pages/vehicle/vehicles.vue',
    name: 'Vehículos',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Marca', dataKey: 'marca' },
      { header: 'Modelo', dataKey: 'modelo' },
      { header: 'Placa', dataKey: 'placa' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedVehicles',
    filename: 'vehiculos',
    title: 'Lista de Vehículos'
  },
  {
    path: 'template/src/views/pages/location/countries.vue',
    name: 'Países',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Código', dataKey: 'codigo' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedCountries',
    filename: 'paises',
    title: 'Lista de Países'
  },
  {
    path: 'template/src/views/pages/location/states.vue',
    name: 'Departamentos',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'País', dataKey: 'country_name' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedStates',
    filename: 'departamentos',
    title: 'Lista de Departamentos'
  },
  {
    path: 'template/src/views/pages/location/cities.vue',
    name: 'Ciudades',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Departamento', dataKey: 'state_name' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedCities',
    filename: 'ciudades',
    title: 'Lista de Ciudades'
  },
  {
    path: 'template/src/views/pages/hrm/pos-departments.vue',
    name: 'Departamentos RH',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Descripción', dataKey: 'descripcion' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedDepartments',
    filename: 'departamentos-rh',
    title: 'Lista de Departamentos'
  },
  {
    path: 'template/src/views/pages/hrm/pos-positions.vue',
    name: 'Cargos/Puestos',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Departamento', dataKey: 'department_name' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedPositions',
    filename: 'cargos',
    title: 'Lista de Cargos'
  },
  {
    path: 'template/src/views/pages/hrm/pos-employees.vue',
    name: 'Empleados',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Código', dataKey: 'codigo' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Cargo', dataKey: 'position_name' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedEmployees',
    filename: 'empleados',
    title: 'Lista de Empleados'
  },
  {
    path: 'template/src/views/pages/settings/financal-settings/bank-settings-list.vue',
    name: 'Cuentas Bancarias',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Banco', dataKey: 'banco' },
      { header: 'Número de Cuenta', dataKey: 'numero_cuenta' },
      { header: 'Tipo', dataKey: 'tipo_cuenta' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedAccounts',
    filename: 'cuentas-bancarias',
    title: 'Lista de Cuentas Bancarias'
  },
  {
    path: 'template/src/views/pages/settings/financal-settings/tax-rates.vue',
    name: 'Tasas de Impuesto',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Tasa (%)', dataKey: 'tasa' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedTaxRates',
    filename: 'tasas-impuesto',
    title: 'Lista de Tasas de Impuesto'
  },
  {
    path: 'template/src/views/pages/settings/financal-settings/currency-settings.vue',
    name: 'Monedas',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Código', dataKey: 'codigo' },
      { header: 'Símbolo', dataKey: 'simbolo' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedCurrencies',
    filename: 'monedas',
    title: 'Lista de Monedas'
  },
  {
    path: 'template/src/views/pages/settings/financal-settings/beneficiary-type-settings.vue',
    name: 'Tipos de Beneficiarios',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Descripción', dataKey: 'descripcion' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedBeneficiaryTypes',
    filename: 'tipos-beneficiarios',
    title: 'Lista de Tipos de Beneficiarios'
  },
  {
    path: 'template/src/views/pages/settings/financal-settings/resolution-settings.vue',
    name: 'Resoluciones',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Número', dataKey: 'numero_resolucion' },
      { header: 'Serie', dataKey: 'serie' },
      { header: 'Rango', dataKey: 'rango' },
      { header: 'Estado', dataKey: 'is_active' }
    ],
    dataSource: 'sortedResolutions',
    filename: 'resoluciones',
    title: 'Lista de Resoluciones'
  }
];

// Función para añadir botones de exportación al template
function addExportButtons(content) {
  const buttonHTML = `          <li>
            <a @click="exportToPDF" data-bs-toggle="tooltip" data-bs-placement="top" title="PDF">
              <img src="@/assets/img/icons/pdf.svg" alt="img" />
            </a>
          </li>
          <li>
            <a @click="exportToExcel" data-bs-toggle="tooltip" data-bs-placement="top" title="Excel">
              <img src="@/assets/img/icons/excel.svg" alt="img" />
            </a>
          </li>
`;

  // Buscar el patrón de table-top-head y agregar los botones antes del botón de refresh
  const pattern = /(<ul class="table-top-head">[\s\S]*?<li>)/;
  if (pattern.test(content)) {
    return content.replace(pattern, `$1\n${buttonHTML}          <li>`);
  }
  return content;
}

// Función para añadir el import de exportUtils
function addImport(content) {
  const importPattern = /import Swal from ['"]sweetalert2['"];/;
  const newImport = `import Swal from 'sweetalert2';\nimport { exportToPDF as exportPDF, exportToExcel as exportExcel } from '@/utils/exportUtils';`;

  if (importPattern.test(content)) {
    return content.replace(importPattern, newImport);
  }
  return content;
}

// Función para añadir los métodos de exportación
function addExportMethods(content, config) {
  const columnsStr = JSON.stringify(config.columns, null, 10).replace(/"(\w+)":/g, '$1:');

  const methodsTemplate = `
    exportToPDF() {
      try {
        const columns = ${columnsStr};

        const data = this.${config.dataSource}.map(item => ({
          ...item,
          is_active: item.is_active ? 'Activo' : 'Inactivo'
        }));

        exportPDF(data, columns, '${config.filename}', '${config.title}');

        Swal.fire({
          icon: 'success',
          title: 'PDF Generado',
          text: 'El archivo PDF se ha descargado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al exportar PDF:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el archivo PDF'
        });
      }
    },

    exportToExcel() {
      try {
        const columns = ${columnsStr};

        const data = this.${config.dataSource}.map(item => ({
          ...item,
          is_active: item.is_active ? 'Activo' : 'Inactivo'
        }));

        exportExcel(data, columns, '${config.filename}', '${config.name}');

        Swal.fire({
          icon: 'success',
          title: 'Excel Generado',
          text: 'El archivo Excel se ha descargado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al exportar Excel:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el archivo Excel'
        });
      }
    },`;

  // Buscar el último método antes del cierre de methods
  const pattern = /([\s\S]*methods:[\s\S]*)(  },\n};[\s]*<\/script>)/;
  if (pattern.test(content)) {
    return content.replace(pattern, `$1\n${methodsTemplate}\n$2`);
  }
  return content;
}

// Procesar cada archivo
filesToUpdate.forEach(config => {
  const filePath = path.join(__dirname, config.path);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${config.path}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Verificar si ya tiene los botones
    if (content.includes('exportToPDF')) {
      console.log(`✓ ${config.name} ya tiene exportación`);
      return;
    }

    // Aplicar transformaciones
    content = addExportButtons(content);
    content = addImport(content);
    content = addExportMethods(content, config);

    // Guardar el archivo
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${config.name} actualizado`);
  } catch (error) {
    console.error(`❌ Error procesando ${config.name}:`, error.message);
  }
});

console.log('\n¡Proceso completado!');
