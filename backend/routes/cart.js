const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// Get user cart (read-only, no locking)
router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const [items] = await pool.query(`
            SELECT 
                ci.cart_item_id,
                ci.product_id,
                ci.quantity_added AS quantity,
                p.product_id,
                p.product_name,
                p.price AS currentPrice,
                p.original_price AS originalPrice,
                p.quantity_stock AS stock,
                p.flash_sale_id,
                fs.end_time AS flashSaleEnd
            FROM CartItems ci
            JOIN Products p ON ci.product_id = p.product_id
            LEFT JOIN FlashSales fs ON p.flash_sale_id = fs.flash_sale_id
            WHERE ci.user_id = ?
        `, [userId]);

        const total = items.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            success: true,
            data: {
                items: items.map(item => ({
                    productId: item.product_id,
                    quantity: item.quantity,
                    product: item
                })),
                total,
                itemCount
            }
        });
    } catch (error) {
        console.error('Cart fetch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add to cart (lightweight lock)
router.post('/:userId/add', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const userId = parseInt(req.params.userId);
        const { productId } = req.body;

        // Lock product row
        const [[product]] = await connection.query(
            'SELECT product_id, quantity_stock FROM Products WHERE product_id = ? FOR UPDATE',
            [productId]
        );
        
        if (!product) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        if (product.quantity_stock < 1) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Out of stock' });
        }

        // Check if already in cart
        const [[existing]] = await connection.query(
            'SELECT quantity_added FROM CartItems WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (existing) {
            await connection.query(
                'UPDATE CartItems SET quantity_added = 1 WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );
        } else {
            await connection.query(
                'INSERT INTO CartItems (user_id, product_id, quantity_added) VALUES (?, ?, 1)',
                [userId, productId]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Added to cart' });
    } catch (error) {
        await connection.rollback();
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

// Update quantity (with lock)
router.patch('/:userId/items/:productId', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const userId = parseInt(req.params.userId);
        const productId = parseInt(req.params.productId);
        const { quantity } = req.body;

        if (quantity < 1) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        // Lock product to check stock
        const [[product]] = await connection.query(
            'SELECT quantity_stock FROM Products WHERE product_id = ? FOR UPDATE',
            [productId]
        );

        if (!product || product.quantity_stock < quantity) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }

        await connection.query(
            'UPDATE CartItems SET quantity_added = ? WHERE user_id = ? AND product_id = ?',
            [quantity, userId, productId]
        );

        await connection.commit();
        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        await connection.rollback();
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

// Remove from cart (no lock needed on product)
router.delete('/:userId/items/:productId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const productId = parseInt(req.params.productId);

        await pool.query(
            'DELETE FROM CartItems WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        res.json({ success: true, message: 'Item removed' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Validate cart (MySQL-side sorting with shared lock)
router.post('/validate', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { userId, items } = req.body;

        // Extract product IDs
        const productIds = items.map(item => item.productId);
        
        if (productIds.length === 0) {
            await connection.rollback();
            return res.json({ success: false, message: 'Cart is empty' });
        }

        // Fetch and lock products in sorted order (MySQL handles sorting)
        const placeholders = productIds.map(() => '?').join(',');
        const [products] = await connection.query(`
            SELECT 
                p.product_id,
                p.quantity_stock,
                p.flash_sale_id,
                fs.end_time
            FROM Products p
            LEFT JOIN FlashSales fs ON p.flash_sale_id = fs.flash_sale_id
            WHERE p.product_id IN (${placeholders})
            ORDER BY p.product_id ASC  -- MySQL sorts for consistent lock order
            LOCK IN SHARE MODE  -- Shared lock (allows concurrent reads)
        `, productIds);

        if (products.length !== productIds.length) {
            await connection.rollback();
            return res.json({ success: false, message: 'Product no longer available' });
        }

        // Validate each product (products already sorted by MySQL)
        for (const product of products) {
            const item = items.find(i => i.productId === product.product_id);
            
            if (!item) {
                await connection.rollback();
                return res.json({ success: false, message: 'Product mismatch in cart' });
            }

            if (product.flash_sale_id && product.end_time && new Date(product.end_time) < new Date()) {
                await connection.rollback();
                return res.json({ success: false, message: 'Flash sale has ended for one or more items' });
            }

            if (product.quantity_stock < 1) {
                await connection.rollback();
                return res.json({ success: false, message: 'One or more items are out of stock' });
            }

            if (product.quantity_stock < item.quantity) {
                await connection.rollback();
                return res.json({ success: false, message: `Insufficient stock. Only ${product.quantity_stock} available` });
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error('Validate cart error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
