from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
import os

# Crear presentación
prs = Presentation()
prs.slide_width = Inches(10)
prs.slide_height = Inches(7.5)

def add_title_slide_with_image(prs, title, subtitle="", image_path=None):
    """Agregar diapositiva de título con imagen de fondo"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # Layout en blanco

    # Agregar imagen de fondo si existe
    if image_path and os.path.exists(image_path):
        left = Inches(0)
        top = Inches(0)
        pic = slide.shapes.add_picture(image_path, left, top, width=prs.slide_width, height=prs.slide_height)
        slide.shapes._spTree.remove(pic._element)
        slide.shapes._spTree.insert(2, pic._element)

    # Overlay oscuro semitransparente
    left = Inches(0)
    top = Inches(0)
    width = Inches(10)
    height = Inches(7.5)
    shape = slide.shapes.add_shape(1, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(0, 0, 0)
    shape.fill.transparency = 0.4
    shape.line.fill.background()

    # Título
    left = Inches(1)
    top = Inches(2.5)
    width = Inches(8)
    height = Inches(1.5)
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.text = title
    tf.paragraphs[0].font.size = Pt(44)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = RGBColor(255, 255, 255)
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER

    # Subtítulo
    if subtitle:
        left = Inches(1)
        top = Inches(4.2)
        width = Inches(8)
        height = Inches(1)
        txBox = slide.shapes.add_textbox(left, top, width, height)
        tf = txBox.text_frame
        tf.text = subtitle
        tf.paragraphs[0].font.size = Pt(20)
        tf.paragraphs[0].font.color.rgb = RGBColor(255, 255, 255)
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER

    return slide

def add_content_slide_with_image(prs, title, content_list, image_path=None):
    """Agregar diapositiva de contenido con viñetas e imagen"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # Layout en blanco

    # Fondo blanco
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = RGBColor(255, 255, 255)

    # Agregar imagen en el lado derecho si existe
    if image_path and os.path.exists(image_path):
        left = Inches(6.5)
        top = Inches(1.5)
        height = Inches(5.5)
        pic = slide.shapes.add_picture(image_path, left, top, height=height)

    # Barra superior roja
    left = Inches(0)
    top = Inches(0)
    width = Inches(10)
    height = Inches(0.8)
    shape = slide.shapes.add_shape(1, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(139, 0, 0)
    shape.line.color.rgb = RGBColor(139, 0, 0)

    # Título
    left = Inches(0.5)
    top = Inches(0.15)
    width = Inches(9)
    height = Inches(0.6)
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.text = title
    tf.paragraphs[0].font.size = Pt(32)
    tf.paragraphs[0].font.bold = True
    tf.paragraphs[0].font.color.rgb = RGBColor(255, 255, 255)

    # Contenido con viñetas (ajustar ancho si hay imagen)
    content_width = Inches(5.5) if image_path and os.path.exists(image_path) else Inches(8.4)
    left = Inches(0.8)
    top = Inches(1.5)
    width = content_width
    height = Inches(5.5)
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True

    for i, item in enumerate(content_list):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = item
        p.font.size = Pt(16)
        p.font.color.rgb = RGBColor(0, 0, 0)
        p.level = 0
        p.space_before = Pt(10)

    return slide

# 1. PORTADA
slide = add_title_slide_with_image(
    prs,
    "SISTEMA DE FACTURACIÓN INTEGRADO CON PLATAFORMA DE COMERCIO ELECTRÓNICO",
    "CERAMICAS TERRAZOS Y PULIDOS UNIVERSAL",
    "presentation_images/portada.jpg"
)

# Agregar información adicional en la portada
left = Inches(2)
top = Inches(5.5)
width = Inches(6)
height = Inches(1.5)
txBox = slide.shapes.add_textbox(left, top, width, height)
tf = txBox.text_frame
tf.text = "CARLOS MAURICIO ARGEÑAL BONILLA\nCarnet: 42141044\n\nLicenciatura en Ingeniería en Informática\nCEUTEC - 2025"
for paragraph in tf.paragraphs:
    paragraph.font.size = Pt(16)
    paragraph.font.color.rgb = RGBColor(255, 255, 255)
    paragraph.alignment = PP_ALIGN.CENTER

# 2. OBJETIVOS
add_content_slide_with_image(
    prs,
    "Objetivos",
    [
        "Objetivo General:",
        "• Desarrollar e implementar en un período de seis meses un sistema integrado de facturación y comercio electrónico para Cerámicas y Terrazos Universal, que permita registrar ventas, emitir facturas y reportes, controlar inventario y ofrecer productos en línea.",
        "",
        "Objetivos Específicos:",
        "• Desarrollar un módulo de facturación electrónica que permita emitir comprobantes fiscales cumpliendo con la normativa tributaria vigente en Honduras.",
        "• Desarrollar un sistema centralizado de control de inventario que registre en tiempo real las entradas, salidas y existencias de productos.",
        "• Diseñar una plataforma de comercio electrónico que permita a los clientes realizar pedidos en línea de manera segura y eficiente."
    ],
    "presentation_images/objetivos.jpg"
)

# 3. PLANTEAMIENTO DEL PROBLEMA
add_content_slide_with_image(
    prs,
    "Planteamiento del Problema",
    [
        "Situación Problemática:",
        "• Cerámicas y Terrazos Universal enfrenta deficiencias operativas debido a que su facturación y control de inventario se realizan manualmente.",
        "• Falta de integración con plataforma de comercio electrónico, generando errores y retrasos.",
        "• Dificultades para emitir reportes contables.",
        "• Ausencia de presencia digital que limita alcance y competitividad.",
        "",
        "Justificación:",
        "• La digitalización empresarial es esencial para MiPymes.",
        "• Permite optimizar procesos, reducir errores y ampliar mercado.",
        "• Mejora la experiencia del cliente.",
        "• Fortalece posición competitiva."
    ],
    "presentation_images/problema.jpg"
)

# 4. MARCO TEÓRICO
add_content_slide_with_image(
    prs,
    "Marco Teórico",
    [
        "Bases Teóricas:",
        "• Transformación digital en MiPymes: 89% planea digitalizarse.",
        "• Factura electrónica en LATAM: Mejora recaudación 3-14%.",
        "• E-commerce: 57% realiza pagos digitales (2021).",
        "• ERP: Visibilidad en tiempo real de inventarios.",
        "• Patrón MVC: Separación lógica de presentación.",
        "",
        "Tecnologías:",
        "• Backend: Node.js + Express.js",
        "• Frontend: Vue.js",
        "• Base de Datos: MySQL",
        "• Infraestructura: Docker + Google Cloud",
        "• APIs: Google Maps, Firebase, Pasarelas de Pago"
    ],
    "presentation_images/marco_teorico.jpg"
)

# 5. ANÁLISIS Y DISEÑO
add_content_slide_with_image(
    prs,
    "Análisis y Diseño",
    [
        "Metodología Mixta:",
        "• Cualitativa: Entrevistas, observación (40h/2 semanas)",
        "• Cuantitativa: Encuestas (30 clientes), usabilidad (SUS)",
        "",
        "Hallazgos Clave:",
        "• Tiempo por venta: 8 min con errores frecuentes",
        "• 87% interesado en ver productos online",
        "• 60% haría pedidos por internet",
        "",
        "Arquitectura:",
        "• Monolítica Modular con límites claros",
        "• APIs RESTful para integración",
        "• Sincronización tiempo real",
        "• Gestión estados de pedidos"
    ],
    "presentation_images/analisis_diseno.jpg"
)

# 6. ANÁLISIS Y RESULTADOS
add_content_slide_with_image(
    prs,
    "Análisis y Resultados",
    [
        "Módulos Implementados:",
        "• Gestión: Clientes, Proveedores, Empleados",
        "• Control Inventario Multi-bodega",
        "• Facturación Electrónica",
        "• Comercio Electrónico",
        "• Dashboard con métricas tiempo real",
        "• Reportes: Ventas, Libro ventas, Estados financieros",
        "",
        "Funcionalidades:",
        "• Roles y permisos granular",
        "• Multi-sucursales y bodegas",
        "• Cálculo automático impuestos (ISV 15%)",
        "• Pasarelas de pago integradas",
        "• Exportación PDF/Excel"
    ],
    "presentation_images/resultados.jpg"
)

# 7. CONCLUSIONES Y RECOMENDACIONES
add_content_slide_with_image(
    prs,
    "Conclusiones y Recomendaciones",
    [
        "Conclusiones:",
        "• Sistema integrado cumple normativa fiscal hondureña",
        "• Plataforma e-commerce amplía alcance de mercado",
        "• Reduce errores manuales y tiempo de procesamiento",
        "• Integración tiempo real: facturación-inventario-ventas",
        "",
        "Recomendaciones:",
        "• Capacitación continua del personal",
        "• Actualizar periódicamente factor cambio monedas",
        "• Respaldos automáticos de base de datos",
        "• Considerar microservicios al crecer",
        "• Integrar con sistemas contables externos",
        "• Módulo marketing digital y análisis clientes"
    ],
    "presentation_images/conclusiones.jpg"
)

# Guardar presentación
prs.save('Presentacion_Proyecto_Graduacion_Final_HD.pptx')
print("Presentacion creada exitosamente con imagenes HD: Presentacion_Proyecto_Graduacion_Final_HD.pptx")
