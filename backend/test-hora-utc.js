// Simular la fecha de la factura
const issueDate = '2026-01-20T01:39:39.000Z';

console.log('=== TEST HORA UTC ===\n');
console.log('Fecha en BD:', issueDate);

const date = new Date(issueDate);

// Método ANTERIOR (getHours - hora local)
const hoursLocal = date.getHours();
const minutesLocal = date.getMinutes();
const ampmLocal = hoursLocal >= 12 ? 'PM' : 'AM';
const displayHoursLocal = hoursLocal % 12 || 12;
console.log('\nMétodo ANTERIOR (hora local):');
console.log(`${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(displayHoursLocal).padStart(2, '0')}:${String(minutesLocal).padStart(2, '0')} ${ampmLocal}`);

// Método NUEVO (getUTCHours - hora UTC original)
const hours = date.getUTCHours();
const minutes = date.getUTCMinutes();
const day = date.getUTCDate();
const month = date.getUTCMonth() + 1;
const year = date.getUTCFullYear();
const ampm = hours >= 12 ? 'PM' : 'AM';
const displayHours = hours % 12 || 12;
console.log('\nMétodo NUEVO (hora UTC original):');
console.log(`${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} ${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`);

console.log('\n✅ Ahora mostrará la hora UTC original (01:39 AM) sin conversión a hora local');
