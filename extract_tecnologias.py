import sys
sys.stdout.reconfigure(encoding='utf-8')
from docx import Document

doc = Document('Correciones_CuartoAvance_CarlosArgeñal_42141044_Correcciones.docx')
paragraphs = [p.text for p in doc.paragraphs]

# Buscar desde "Herramientas Utilizadas y Tecnologías" hasta "METODOLOGÍA"
start_idx = None
end_idx = None

for i, p in enumerate(paragraphs):
    if '4.3 Herramientas Utilizadas y Tecnologías' in p or 'Herramientas Utilizadas y Tecnologías' in p:
        start_idx = i
    if start_idx and 'METODOLOGÍA' in p.upper() and i > start_idx + 5:
        end_idx = i
        break

if start_idx:
    print("=== HERRAMIENTAS Y TECNOLOGÍAS ===\n")
    for i in range(start_idx, end_idx if end_idx else min(start_idx + 100, len(paragraphs))):
        p = paragraphs[i].strip()
        if p:
            print(p)
            print()
