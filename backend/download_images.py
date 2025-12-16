import requests
import os

# Crear directorio si no existe
os.makedirs('presentation_images', exist_ok=True)

# URLs de imágenes HD gratuitas de Unsplash (específicas para cada tema)
images = {
    'portada': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80',  # Business technology
    'objetivos': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&q=80',  # Goal setting
    'problema': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80',  # Business analytics
    'marco_teorico': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',  # Digital technology
    'analisis_diseno': 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1920&q=80',  # Team collaboration
    'resultados': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',  # Dashboard analytics
    'conclusiones': 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=1920&q=80'  # Success/achievement
}

def download_image(url, filename):
    try:
        print(f"Descargando {filename}...")
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        filepath = os.path.join('presentation_images', filename)
        with open(filepath, 'wb') as f:
            f.write(response.content)
        print(f"OK - Descargado: {filename}")
        return True
    except Exception as e:
        print(f"ERROR descargando {filename}: {str(e)}")
        return False

# Descargar todas las imágenes
print("Descargando imágenes HD para la presentación...\n")
for name, url in images.items():
    download_image(url, f"{name}.jpg")

print("\n¡Descarga completada!")
