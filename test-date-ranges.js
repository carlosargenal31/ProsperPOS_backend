/**
 * Script para probar los rangos de fechas y opciones de agrupación disponibles
 */

const moment = require('moment');

// Simular la lógica del computed property availableGroupByOptions
function getAvailableOptions(dateFrom, dateTo) {
  const groupByOptions = [
    { label: "Por Hora", value: "hour" },
    { label: "Por Día", value: "day" },
    { label: "Por Semana", value: "week" },
    { label: "Por Mes", value: "month" },
    { label: "Por Año", value: "year" },
    { label: "Total", value: "total" }
  ];

  if (!dateFrom || !dateTo) {
    return groupByOptions;
  }

  const start = moment(dateFrom);
  const end = moment(dateTo);
  const days = end.diff(start, 'days') + 1;

  console.log(`\n📅 Rango: ${dateFrom} a ${dateTo} (${days} días)`);

  // 1 día exacto = solo por hora
  if (days === 1) {
    const options = groupByOptions.filter(opt => opt.value === 'hour');
    console.log('   ✅ Opciones disponibles:', options.map(o => o.label).join(', '));
    return options;
  }

  // 2-30 días = solo por día
  if (days >= 2 && days <= 30) {
    const options = groupByOptions.filter(opt => opt.value === 'day');
    console.log('   ✅ Opciones disponibles:', options.map(o => o.label).join(', '));
    return options;
  }

  // 31-90 días = por día, por semana, por mes
  if (days >= 31 && days <= 90) {
    const options = groupByOptions.filter(opt => ['day', 'week', 'month'].includes(opt.value));
    console.log('   ✅ Opciones disponibles:', options.map(o => o.label).join(', '));
    return options;
  }

  // 91-365 días = por semana, por mes
  if (days >= 91 && days <= 365) {
    const options = groupByOptions.filter(opt => ['week', 'month'].includes(opt.value));
    console.log('   ✅ Opciones disponibles:', options.map(o => o.label).join(', '));
    return options;
  }

  // Más de 1 año = por mes, por año, total
  const options = groupByOptions.filter(opt => ['month', 'year', 'total'].includes(opt.value));
  console.log('   ✅ Opciones disponibles:', options.map(o => o.label).join(', '));
  return options;
}

console.log('🧪 === PRUEBA DE RANGOS DE FECHAS Y OPCIONES DE AGRUPACIÓN ===');

// Casos de prueba
const testCases = [
  { dateFrom: '2025-12-10', dateTo: '2025-12-10', description: '1 día (Hoy)' },
  { dateFrom: '2025-12-08', dateTo: '2025-12-10', description: '3 días' },
  { dateFrom: '2025-12-04', dateTo: '2025-12-10', description: '7 días (1 semana)' },
  { dateFrom: '2025-12-01', dateTo: '2025-12-10', description: '10 días' },
  { dateFrom: '2025-11-11', dateTo: '2025-12-10', description: '30 días' },
  { dateFrom: '2025-11-01', dateTo: '2025-12-31', description: '61 días (2 meses)' },
  { dateFrom: '2025-10-01', dateTo: '2025-12-31', description: '92 días (3 meses)' },
  { dateFrom: '2025-07-01', dateTo: '2025-12-31', description: '184 días (6 meses)' },
  { dateFrom: '2025-01-01', dateTo: '2025-12-31', description: '365 días (1 año)' },
  { dateFrom: '2024-01-01', dateTo: '2025-12-31', description: '730 días (2 años)' }
];

testCases.forEach(test => {
  console.log(`\n📌 ${test.description}`);
  getAvailableOptions(test.dateFrom, test.dateTo);
});

console.log('\n✅ === PRUEBAS COMPLETADAS ===\n');
