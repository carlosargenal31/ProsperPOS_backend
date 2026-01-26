const date = '2026-12-28T06:00:00.000Z';
const dateStr = date.split('T')[0];
const [year, month, day] = dateStr.split('-');
console.log('Date string:', date);
console.log('After split T:', dateStr);
console.log('Year:', year, 'Month:', month, 'Day:', day);
console.log('Formatted:', `${day}/${month}/${year}`);

// Also test what new Date does
const d = new Date(date);
console.log('New Date getDate():', d.getDate());
console.log('New Date getMonth()+1:', d.getMonth() + 1);
console.log('New Date getFullYear():', d.getFullYear());

// Test with local time
console.log('\nLocal timezone offset:', d.getTimezoneOffset());
