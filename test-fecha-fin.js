const date = '2026-12-28T06:00:00.000Z';
const d = new Date(date);
console.log('Original:', date);
console.log('getDate() sin +6:', d.getDate());

d.setHours(d.getHours() + 6);
console.log('Con +6 horas:', d.toISOString());
console.log('getDate() con +6:', d.getDate());

const formatted = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
console.log('Fecha formateada:', formatted);
