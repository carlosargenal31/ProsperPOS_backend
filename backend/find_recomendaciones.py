import sys
sys.stdout.reconfigure(encoding='utf-8')
from docx import Document

doc = Document('Correciones_CuartoAvance_CarlosArgeñal_42141044_Correcciones.docx')
paragraphs = [p.text for p in doc.paragraphs]

# Buscar el índice donde comienzan las recomendaciones
start_idx = None
end_idx = None

for i, p in enumerate(paragraphs):
    text_lower = p.lower().strip()
    if 'recomendacion' in text_lower and len(p.strip()) < 50:
        start_idx = i
        print(f"Inicio encontrado en línea {i}: {p}")
        break

if start_idx:
    # Buscar las siguientes líneas después del título
    print("\n=== RECOMENDACIONES ===\n")
    for i in range(start_idx, min(start_idx + 50, len(paragraphs))):
        p = paragraphs[i].strip()
        if p and len(p) > 20:  # Solo líneas con contenido
            print(p)
            print()
