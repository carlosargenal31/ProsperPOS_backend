// Simular la fecha de la factura
const issueDate = '2026-01-20T01:39:39.000Z';

console.log('=== TEST CONVERSIÓN DE HORA ===\n');
console.log('Fecha en BD:', issueDate);
console.log('Tipo:', typeof issueDate);

// Método 1: new Date() directo
const date1 = new Date(issueDate);
console.log('\n--- Método 1: new Date(issueDate) ---');
console.log('ISO:', date1.toISOString());
console.log('getHours():', date1.getHours());
console.log('getMinutes():', date1.getMinutes());
const hours1 = date1.getHours();
const ampm1 = hours1 >= 12 ? 'PM' : 'AM';
const displayHours1 = hours1 % 12 || 12;
console.log('Resultado:', `${displayHours1}:${String(date1.getMinutes()).padStart(2, '0')} ${ampm1}`);

// Verificar si debe ser 9:38 PM
console.log('\n--- OBJETIVO ---');
console.log('Debería mostrar: 7:39 PM (19/01/2026)');
console.log('Porque 01:39 UTC - 6 horas = 19:39 del día anterior');
