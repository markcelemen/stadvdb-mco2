const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// Get all products (from database)
router.get('/', async (req, res) => {
    try {
        const { category, search, flashSale } = req.query;
        
        let query = `
            SELECT 
                p.product_id AS id,
                p.product_name AS name,
                p.price AS currentPrice,
                p.original_price AS originalPrice,
                p.quantity_stock AS stock,
                p.category,
                p.flash_sale_id AS flashSaleId,
                p.discount_rate AS discount,
                CASE WHEN p.flash_sale_id IS NOT NULL THEN TRUE ELSE FALSE END AS isFlashSale,
                COALESCE(SUM(oi.quantity_sold), 0) AS sold
            FROM Products p
            LEFT JOIN OrderItems oi ON p.product_id = oi.product_id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ' AND p.category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND p.product_name LIKE ?';
            params.push(`%${search}%`);
        }

        if (flashSale === 'true') {
            query += ' AND p.flash_sale_id IS NOT NULL';
        }

        query += ' GROUP BY p.product_id ORDER BY p.product_id';

        const [products] = await pool.query(query, params);

        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        console.error('Fetch products error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single product (from database)
router.get('/:id', async (req, res) => {
    try {
        const [[product]] = await pool.query(`
            SELECT 
                product_id AS id,
                product_name AS name,
                price AS currentPrice,
                original_price AS originalPrice,
                quantity_stock AS stock,
                category,
                flash_sale_id AS flashSaleId,
                discount_rate AS discount,
                COALESCE((SELECT SUM(quantity_sold) FROM OrderItems WHERE product_id = ?), 0) AS sold
            FROM Products 
            WHERE product_id = ?
        `, [parseInt(req.params.id), parseInt(req.params.id)]);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Fetch product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update product stock (with transaction & lock)
router.patch('/:id/stock', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { quantity } = req.body;
        const productId = parseInt(req.params.id);

        // Lock product row
        const [[product]] = await connection.query(
            'SELECT product_id, quantity_stock FROM Products WHERE product_id = ? FOR UPDATE',
            [productId]
        );

        if (!product) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const newStock = product.quantity_stock + quantity;
        
        if (newStock < 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot reduce stock below zero'
            });
        }

        await connection.query(
            'UPDATE Products SET quantity_stock = ? WHERE product_id = ?',
            [newStock, productId]
        );

        await connection.commit();

        const [[updated]] = await pool.query(
            'SELECT product_id AS id, product_name AS name, quantity_stock AS stock FROM Products WHERE product_id = ?',
            [productId]
        );

        res.json({
            success: true,
            data: updated,
            message: 'Stock updated successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Update stock error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;