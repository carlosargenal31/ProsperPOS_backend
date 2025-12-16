import sys
sys.stdout.reconfigure(encoding='utf-8')
from docx import Document

doc = Document('Correciones_CuartoAvance_CarlosArgeñal_42141044_Correcciones.docx')
paragraphs = [p.text for p in doc.paragraphs]

# Buscar secciones de tecnologías
for i, p in enumerate(paragraphs):
    text_lower = p.lower().strip()
    if any(keyword in text_lower for keyword in ['herramientas utilizadas', 'tecnologías', 'lenguajes y frameworks', 'node.js', 'express.js', 'vue.js']):
        if len(p.strip()) < 100 or 'node.js' in text_lower or 'express' in text_lower:
            print(f"{i}: {p[:200]}")
