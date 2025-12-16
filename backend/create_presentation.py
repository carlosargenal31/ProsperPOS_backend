from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor

# Crear presentación
prs = Presentation()
prs.slide_width = Inches(10)
prs.slide_height = Inches(7.5)

def add_title_slide(prs, title, subtitle=""):
    """Agregar diapositiva de título"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # Layout en blanco

    # Fondo con gradiente rojo
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = RGBColor(139, 0, 0)  # Color vino/rojo oscuro

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

def add_content_slide(prs, title, content_list):
    """Agregar diapositiva de contenido con viñetas"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # Layout en blanco

    # Fondo blanco
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = RGBColor(255, 255, 255)

    # Barra superior roja
    left = Inches(0)
    top = Inches(0)
    width = Inches(10)
    height = Inches(0.8)
    shape = slide.shapes.add_shape(1, left, top, width, height)  # Rectángulo
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

    # Contenido con viñetas
    left = Inches(0.8)
    top = Inches(1.5)
    width = Inches(8.4)
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
        p.font.size = Pt(18)
        p.font.color.rgb = RGBColor(0, 0, 0)
        p.level = 0
        p.space_before = Pt(12)

    return slide

# 1. PORTADA
add_title_slide(
    prs,
    "SISTEMA DE FACTURACIÓN INTEGRADO CON PLATAFORMA DE COMERCIO ELECTRÓNICO",
    "CERAMICAS TERRAZOS Y PULIDOS UNIVERSAL"
)

slide = prs.slides[-1]
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
add_content_slide(
    prs,
    "Objetivos",
    [
        "Objetivo General:",
        "• Desarrollar e implementar en un período de seis meses un sistema integrado de facturación y comercio electrónico para Cerámicas y Terrazos Universal, que permita registrar ventas, emitir facturas y reportes, controlar inventario y ofrecer productos en línea, fortaleciendo la presencia digital de la empresa.",
        "",
        "Objetivos Específicos:",
        "• Desarrollar un módulo de facturación electrónica que permita emitir comprobantes fiscales cumpliendo con la normativa tributaria vigente en Honduras.",
        "• Desarrollar un sistema centralizado de control de inventario que registre en tiempo real las entradas, salidas y existencias de productos.",
        "• Diseñar una plataforma de comercio electrónico que permita a los clientes realizar pedidos en línea de manera segura y eficiente."
    ]
)

# 3. PLANTEAMIENTO DEL PROBLEMA
add_content_slide(
    prs,
    "Planteamiento del Problema",
    [
        "Situación Problemática:",
        "• Cerámicas y Terrazos Universal, ubicada en La Ceiba, Honduras, enfrenta deficiencias operativas debido a que su facturación y control de inventario se realizan manualmente.",
        "• Falta de integración con una plataforma de comercio electrónico, generando errores y retrasos en la atención al cliente.",
        "• Dificultades para emitir reportes contables y ausencia de presencia digital que limita su alcance y competitividad en el mercado actual.",
        "",
        "Justificación:",
        "• La digitalización empresarial es un requisito esencial para la permanencia y el fortalecimiento competitivo de las MiPymes.",
        "• Permite optimizar procesos internos, reducir errores, ampliar el alcance de mercado y mejorar la experiencia del cliente."
    ]
)

# 4. MARCO TEÓRICO
add_content_slide(
    prs,
    "Marco Teórico",
    [
        "Bases Teóricas Principales:",
        "• Transformación digital en MiPymes: El 89% de las Pymes latinoamericanas planea proceder con su digitalización.",
        "• Factura electrónica en Latinoamérica: Implementada en 17 países de ALC, mejorando la recaudación entre 3% y 14%.",
        "• Comercio electrónico en países en desarrollo: 57% de adultos en economías en desarrollo realizó pagos digitales en 2021.",
        "• Gestión de inventarios y ERP: Sistemas que proporcionan visibilidad en tiempo real de inventarios, ventas y pedidos.",
        "• Patrón MVC: Arquitectura que separa la lógica de presentación y procesos de negocio.",
        "",
        "Tecnologías Utilizadas:",
        "• Backend: Node.js y Express.js",
        "• Frontend: Vue.js",
        "• Base de Datos: MySQL",
        "• Infraestructura: Docker y Google Cloud"
    ]
)

# 5. ANÁLISIS Y DISEÑO
add_content_slide(
    prs,
    "Análisis y Diseño",
    [
        "Metodología Mixta:",
        "• Enfoque Cualitativo: Entrevistas semiestructuradas, observación participante (40 horas en 2 semanas).",
        "• Enfoque Cuantitativo: Encuestas a 30 clientes frecuentes, medición de usabilidad (System Usability Scale).",
        "",
        "Hallazgos Principales:",
        "• Tiempo promedio por venta: 8 minutos con errores frecuentes de cálculo.",
        "• 87% de clientes está interesado en ver productos en línea.",
        "• 60% haría pedidos por internet.",
        "",
        "Arquitectura del Sistema:",
        "• Arquitectura Monolítica Modular con límites claros entre módulos.",
        "• APIs RESTful para comunicación entre sistemas.",
        "• Sincronización de inventarios en tiempo real.",
        "• Gestión de estados de pedidos integrada."
    ]
)

# 6. ANÁLISIS Y RESULTADOS
add_content_slide(
    prs,
    "Análisis y Resultados",
    [
        "Módulos Implementados:",
        "• Gestión de Clientes, Proveedores y Empleados",
        "• Control de Inventario Multi-bodega",
        "• Sistema de Facturación Electrónica",
        "• Plataforma de Comercio Electrónico",
        "• Panel Administrativo (Dashboard) con métricas en tiempo real",
        "• Reportes: Ventas por vendedor, Libro de ventas, Estados financieros",
        "",
        "Funcionalidades Clave:",
        "• Sistema de roles y permisos granular",
        "• Gestión de múltiples sucursales y bodegas",
        "• Cálculo automático de impuestos (ISV 15%)",
        "• Integración con pasarelas de pago",
        "• Exportación a PDF y Excel",
        "• Sincronización en tiempo real entre módulos"
    ]
)

# 7. CONCLUSIONES Y RECOMENDACIONES
add_content_slide(
    prs,
    "Conclusiones y Recomendaciones",
    [
        "Conclusiones:",
        "• Se desarrolló exitosamente un sistema integrado que cumple con la normativa fiscal hondureña.",
        "• Se implementó una plataforma de comercio electrónico que amplía el alcance de mercado.",
        "• El sistema reduce significativamente los errores manuales y el tiempo de procesamiento de ventas.",
        "• Se logró la integración en tiempo real entre facturación, inventario y ventas en línea.",
        "",
        "Recomendaciones:",
        "• Capacitación continua del personal en el uso del sistema.",
        "• Actualización periódica del factor de cambio de monedas.",
        "• Implementar respaldos automáticos de la base de datos.",
        "• Considerar migración a microservicios conforme crezca la empresa.",
        "• Integrar con sistemas de contabilidad externos para mayor automatización.",
        "• Implementar módulo de marketing digital y análisis de comportamiento de clientes."
    ]
)

# Guardar presentación
prs.save('Presentacion_Proyecto_Graduacion_Final.pptx')
print("Presentación creada exitosamente: Presentacion_Proyecto_Graduacion_Final.pptx")
