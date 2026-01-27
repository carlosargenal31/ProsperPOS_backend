@echo off
echo ===== PRUEBA API LIBRO DE VENTAS =====
echo.
echo Consultando libro de ventas del 20-23 de enero...
echo.

curl -X GET "http://localhost:3000/api/v1/sales-book?date_from=2026-01-20&date_to=2026-01-23" ^
  -H "Content-Type: application/json" ^
  --silent | node -e "const fs=require('fs'); const data=fs.readFileSync(0,'utf-8'); const json=JSON.parse(data); if(json.success){const inv=json.data.invoices; console.log('\n'); console.log('='.repeat(120)); console.log('Nro Doc'.padEnd(15)+'Tipo'.padEnd(12)+'Subtotal'.padStart(12)+'Descuento'.padStart(12)+'Impuesto'.padStart(12)+'Recargos'.padStart(12)+'Total'.padStart(12)); console.log('='.repeat(120)); inv.slice(0,5).forEach(i=>{console.log(i.nro_documento.padEnd(15)+i.tipo_documento.padEnd(12)+parseFloat(i.subtotal||0).toFixed(2).padStart(12)+parseFloat(i.descuento||0).toFixed(2).padStart(12)+parseFloat(i.impuesto||0).toFixed(2).padStart(12)+parseFloat(i.recargos||0).toFixed(2).padStart(12)+parseFloat(i.total||0).toFixed(2).padStart(12))}); console.log('='.repeat(120)); const t=json.data.totals; console.log('\nTOTALES:'); console.log('Subtotal:  L '+parseFloat(t.subtotal_total||0).toFixed(2)); console.log('Descuento: L '+parseFloat(t.descuento_total||0).toFixed(2)); console.log('Impuesto:  L '+parseFloat(t.impuesto_total||0).toFixed(2)); console.log('Recargos:  L '+parseFloat(t.recargos_total||0).toFixed(2)); console.log('Total:     L '+parseFloat(t.total_total||0).toFixed(2)); }else{console.error('ERROR:',json.message);}"

echo.
pause
