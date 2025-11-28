const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

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

// Add to cart (always set quantity = 1; do not increment)
router.post('/:userId/add', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { productId } = req.body;

        const [[product]] = await pool.query(
            'SELECT product_id, quantity_stock FROM Products WHERE product_id = ?',
            [productId]
        );
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.quantity_stock < 1) return res.status(400).json({ success: false, message: 'Out of stock' });

        // Check if already in cart
        const [[existing]] = await pool.query(
            'SELECT quantity_added FROM CartItems WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (existing) {
            // Force quantity to 1 (no accumulation)
            await pool.query(
                'UPDATE CartItems SET quantity_added = 1 WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );
        } else {
            await pool.query(
                'INSERT INTO CartItems (user_id, product_id, quantity_added) VALUES (?, ?, 1)',
                [userId, productId]
            );
        }

        res.json({ success: true, message: 'Added to cart (quantity set to 1)' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update quantity
router.patch('/:userId/items/:productId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const productId = parseInt(req.params.productId);
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        // Check stock
        const [[product]] = await pool.query(
            'SELECT quantity_stock FROM Products WHERE product_id = ?',
            [productId]
        );

        if (!product || product.quantity_stock < quantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }

        await pool.query(
            'UPDATE CartItems SET quantity_added = ? WHERE user_id = ? AND product_id = ?',
            [quantity, userId, productId]
        );

        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Remove from cart
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

// Validate cart before checkout
router.post('/validate', async (req, res) => {
    try {
        const { userId, items } = req.body;

        for (const item of items) {
            const [[product]] = await pool.query(`
                SELECT 
                    p.quantity_stock,
                    p.flash_sale_id,
                    fs.end_time
                FROM Products p
                LEFT JOIN FlashSales fs ON p.flash_sale_id = fs.flash_sale_id
                WHERE p.product_id = ?
            `, [item.productId]);

            if (!product) {
                return res.json({ success: false, message: 'Product no longer available' });
            }

            // Check if flash sale ended
            if (product.flash_sale_id && product.end_time && new Date(product.end_time) < new Date()) {
                return res.json({ success: false, message: 'Flash sale has ended for one or more items' });
            }

            // Check stock
            if (product.quantity_stock < 1) {
                return res.json({ success: false, message: 'One or more items are out of stock' });
            }

            if (product.quantity_stock < item.quantity) {
                return res.json({ success: false, message: `Insufficient stock. Only ${product.quantity_stock} available` });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Validate cart error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
