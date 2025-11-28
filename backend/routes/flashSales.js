const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET flash sales with their products
router.get('/', async (req, res) => {
  try {
    const [sales] = await pool.query(`
      SELECT 
        fs.flash_sale_id AS id,
        fs.name,
        fs.start_time,
        fs.end_time
      FROM FlashSales fs
      WHERE 
        fs.end_time > NOW()           -- not yet ended
        AND fs.start_time <= NOW()    -- already started (optional; remove if you want upcoming too)
      ORDER BY fs.end_time ASC        -- soonest to end first
    `);

    if (sales.length === 0) return res.json({ success: true, data: [] });

    const saleIds = sales.map(s => s.id);
    const placeholders = saleIds.map(() => '?').join(',');
    const [products] = await pool.query(`
      SELECT 
        p.product_id AS id,
        p.flash_sale_id AS flashSaleId,
        p.product_name AS name,
        p.price AS currentPrice,
        p.original_price AS originalPrice,
        p.discount_rate AS discount,
        p.quantity_stock AS stock,
        p.category
      FROM Products p
      WHERE p.flash_sale_id IN (${placeholders})
      ORDER BY p.flash_sale_id, p.product_id
    `, saleIds);

    const bySale = new Map(sales.map(s => [s.id, { ...s, products: [] }]));
    for (const p of products) bySale.get(p.flashSaleId)?.products.push(p);

    res.json({ success: true, data: Array.from(bySale.values()) });
  } catch (err) {
    console.error('Error loading flash sales:', err);
    res.status(500).json({ success: false, message: 'Failed to load flash sales' });
  }
});

// (optional) GET a single flash sale with products
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [[sale]] = await pool.query(`
      SELECT flash_sale_id AS id, name, start_time, end_time
      FROM FlashSales WHERE flash_sale_id = ?
    `, [id]);

    if (!sale) return res.status(404).json({ success: false, message: 'Flash sale not found' });

    const [products] = await pool.query(`
      SELECT 
        product_id AS id, product_name AS name, price AS currentPrice,
        original_price AS originalPrice, discount_rate AS discount,
        quantity_stock AS stock, category
      FROM Products WHERE flash_sale_id = ?
    `, [id]);

    res.json({ success: true, data: { ...sale, products } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load flash sale' });
  }
});

module.exports = router;