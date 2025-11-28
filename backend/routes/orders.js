const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// Create order
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { userId, items, shippingAddress, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            throw new Error('Cart is empty');
        }

        let total = 0;

        // Validate stock for ALL items first (before any updates)
        for (const item of items) {
            const [[product]] = await connection.query(`
                SELECT 
                    p.quantity_stock, 
                    p.price, 
                    p.flash_sale_id,
                    p.product_name,
                    fs.end_time as flash_end
                FROM Products p
                LEFT JOIN FlashSales fs ON p.flash_sale_id = fs.flash_sale_id
                WHERE p.product_id = ?
                FOR UPDATE
            `, [item.productId]);

            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }
            
            // Check flash sale hasn't ended
            if (product.flash_sale_id && product.flash_end && new Date(product.flash_end) < new Date()) {
                throw new Error(`Flash sale has ended for ${product.product_name}`);
            }
            
            // Check sufficient stock
            if (product.quantity_stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.product_name}. Only ${product.quantity_stock} available, but you ordered ${item.quantity}`);
            }

            total += product.price * item.quantity;
        }

        // Create order
        const [orderResult] = await connection.query(
            'INSERT INTO Orders (buyer_id, created_at) VALUES (?, NOW())',
            [userId]
        );

        const orderId = orderResult.insertId;

        // Insert order items and reduce stock
        for (const item of items) {
            // Insert order item
            await connection.query(
                'INSERT INTO OrderItems (order_id, product_id, quantity_sold) VALUES (?, ?, ?)',
                [orderId, item.productId, item.quantity]
            );

            // Reduce stock by the ORDERED QUANTITY
            const [updateResult] = await connection.query(
                'UPDATE Products SET quantity_stock = quantity_stock - ? WHERE product_id = ? AND quantity_stock >= ?',
                [item.quantity, item.productId, item.quantity]
            );

            // Double-check the update succeeded
            if (updateResult.affectedRows === 0) {
                throw new Error(`Failed to update stock for product ${item.productId}. Possible race condition.`);
            }
        }

        // Clear cart
        await connection.query('DELETE FROM CartItems WHERE user_id = ?', [userId]);

        await connection.commit();

        res.status(201).json({
            success: true,
            data: { orderId, total },
            message: 'Order placed successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Order error:', error);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

// Get user orders
router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const [orders] = await pool.query(`
            SELECT 
                o.order_id,
                o.created_at,
                COUNT(oi.order_items_id) as item_count,
                SUM(p.price * oi.quantity_sold) as total
            FROM Orders o
            LEFT JOIN OrderItems oi ON o.order_id = oi.order_id
            LEFT JOIN Products p ON oi.product_id = p.product_id
            WHERE o.buyer_id = ?
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
        `, [userId]);

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Fetch orders error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;