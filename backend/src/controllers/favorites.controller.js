const { getConnection } = require('../utils/database');

// Obtener todos los productos favoritos del cliente
exports.getFavorites = async (req, res) => {
  const connection = await getConnection();
  try {
    const customerId = req.customer.id;

    const [favorites] = await connection.execute(
      `SELECT
        f.id as favorite_id,
        f.created_at as favorited_at,
        p.id,
        p.name,
        p.code,
        p.description,
        p.price_1 as price,
        p.brand_id,
        b.name as brand_name,
        p.category_id,
        c.name as category_name,
        p.subcategory_id,
        s.name as subcategory_name,
        p.tax_id,
        tr.rate as tax_rate,
        p.image,
        COALESCE(u.name, 'UNIDAD') as unit
       FROM customer_favorites f
       INNER JOIN products p ON f.product_id = p.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories s ON p.subcategory_id = s.id
       LEFT JOIN tax_rates tr ON p.tax_id = tr.id
       LEFT JOIN units u ON p.unit_id = u.id
       WHERE f.customer_id = ?
       ORDER BY f.created_at DESC`,
      [customerId]
    );

    res.json({ success: true, favorites });
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los productos favoritos' });
  } finally {
    connection.release();
  }
};

// Agregar producto a favoritos
exports.addFavorite = async (req, res) => {
  const connection = await getConnection();
  try {
    const customerId = req.customer.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'ID del producto es requerido' });
    }

    // Verificar si el producto existe
    const [product] = await connection.execute(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );

    if (product.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    // Intentar agregar a favoritos (si ya existe, la clave UNIQUE evitará duplicados)
    try {
      await connection.execute(
        'INSERT INTO customer_favorites (customer_id, product_id) VALUES (?, ?)',
        [customerId, product_id]
      );

      res.status(201).json({ success: true, message: 'Producto agregado a favoritos' });
    } catch (error) {
      // Si es error de duplicado, devolver un mensaje amigable
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(200).json({ success: true, message: 'El producto ya está en favoritos' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error al agregar a favoritos:', error);
    res.status(500).json({ success: false, message: 'Error al agregar el producto a favoritos' });
  } finally {
    connection.release();
  }
};

// Eliminar producto de favoritos
exports.removeFavorite = async (req, res) => {
  const connection = await getConnection();
  try {
    const customerId = req.customer.id;
    const { product_id } = req.params;

    const [result] = await connection.execute(
      'DELETE FROM customer_favorites WHERE customer_id = ? AND product_id = ?',
      [customerId, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado en favoritos' });
    }

    res.json({ success: true, message: 'Producto eliminado de favoritos' });
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el producto de favoritos' });
  } finally {
    connection.release();
  }
};

// Verificar si un producto está en favoritos
exports.isFavorite = async (req, res) => {
  const connection = await getConnection();
  try {
    const customerId = req.customer.id;
    const { product_id } = req.params;

    const [result] = await connection.execute(
      'SELECT id FROM customer_favorites WHERE customer_id = ? AND product_id = ?',
      [customerId, product_id]
    );

    res.json({ success: true, isFavorite: result.length > 0 });
  } catch (error) {
    console.error('Error al verificar favorito:', error);
    res.status(500).json({ success: false, message: 'Error al verificar si el producto está en favoritos' });
  } finally {
    connection.release();
  }
};
