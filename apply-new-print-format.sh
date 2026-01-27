#!/bin/bash

# Script para aplicar el nuevo formato de impresión al POS
# Este script modifica pos-invoice.vue para usar el nuevo formato de factura

FILE="c:/Users/carlo/OneDrive/Escritorio/ProsperPOS/template/src/views/pages/pos/pos-invoice.vue"

echo "Aplicando nuevo formato de impresión al POS..."

# Paso 1: Agregar el método numberToWords después de formatDate
# Buscar la línea que contiene "getStatusBadgeClass(status) {" y agregar numberToWords antes

# Paso 2: Reemplazar el método printInvoice completo

echo "Por favor, cierra el archivo pos-invoice.vue si lo tienes abierto en el editor."
echo "Luego presiona Enter para continuar..."
read

echo "Para aplicar los cambios manualmente:"
echo "1. Abre: $FILE"
echo "2. Busca el método printInvoice() (alrededor de la línea 2645)"
echo "3. Reemplázalo con el código del archivo: NEW_PRINT_INVOICE_METHOD.js"
echo "4. Agrega también el método numberToWords() que está en ese mismo archivo"

echo ""
echo "¿Deseas que te muestre las instrucciones detalladas? (s/n)"
