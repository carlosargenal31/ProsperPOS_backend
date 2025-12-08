const fs = require('fs');

const filePath = 'C:\\Users\\carlo\\OneDrive\\Escritorio\\ProsperPOS\\template\\src\\views\\pages\\inventory\\cargo-descargo-form.vue';

let content = fs.readFileSync(filePath, 'utf8');

// Reemplazos
content = content.replace(/useToast\(\)\.error\('([^']+)'\)/g, "Swal.fire('Error', '$1', 'error')");
content = content.replace(/useToast\(\)\.success\('([^']+)'\)/g, "Swal.fire('Éxito', '$1', 'success')");
content = content.replace(/useToast\(\)\.warning\('([^']+)'\)/g, "Swal.fire('Advertencia', '$1', 'warning')");
content = content.replace(/useToast\(\)\.info\('([^']+)'\)/g, "Swal.fire('Info', '$1', 'info')");

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Archivo corregido exitosamente');
