const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/routes/resolution.routes.js');

try {
  let content = fs.readFileSync(targetPath, 'utf8');

  const newRoute = `
/**
 * @route   GET /api/v1/resolutions/active
 * @desc    Obtener la resolución activa actual
 * @access  Private
 */
router.get('/active',
  requirePermission('resolutions.read'),
  async (req, res) => {
    try {
      const query = \`
        SELECT * FROM resolutions
        WHERE is_active = 1
        AND deleted_at IS NULL
        AND fecha_inicio <= CURDATE()
        AND fecha_fin >= CURDATE()
        ORDER BY created_at DESC
        LIMIT 1
      \`;
      const resolutions = await db.query(query);

      if (!resolutions || resolutions.length === 0) {
        return sendErrorResponse(res, 404, 'No hay resolución activa disponible');
      }

      return sendSuccessResponse(res, resolutions[0], 'Resolución activa obtenida exitosamente');

    } catch (error) {
      logger.error('Error getting active resolution:', error);
      return sendErrorResponse(res, 500, 'Error al obtener la resolución activa');
    }
  }
);

`;

  // Verificar si ya existe
  if (content.includes('/active')) {
    console.log('✓ Ruta /active ya existe en resolution.routes.js');
    process.exit(0);
  }

  // Insertar antes de la ruta /:id
  const marker = '/**\n * @route   GET /api/v1/resolutions/:id';
  content = content.replace(marker, newRoute + marker);

  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('✓ Ruta /active agregada exitosamente a resolution.routes.js');
  console.log('✓ Ahora puedes obtener la resolución activa en GET /api/v1/resolutions/active');

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
