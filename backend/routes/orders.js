const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Create order with deadlock-safe locking
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { userId, items, shippingAddress, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            throw new Error('Cart is empty');
        }

        // STEP 1: Extract product IDs
        const productIds = items.map(item => item.productId);
        
        let total = 0;
        const validatedProducts = [];

        // STEP 2: Lock products in ascending ID order (sorted by MySQL)
        const placeholders = productIds.map(() => '?').join(',');
        const [products] = await connection.query(`
            SELECT 
                p.product_id,
                p.product_name,
                p.quantity_stock, 
                p.price, 
                p.flash_sale_id,
                fs.end_time as flash_end
            FROM Products p
            LEFT JOIN FlashSales fs ON p.flash_sale_id = fs.flash_sale_id
            WHERE p.product_id IN (${placeholders})
            ORDER BY p.product_id ASC  -- MySQL sorts in ascending order for consistent locking
            FOR UPDATE  -- Pessimistic lock in sorted order
        `, productIds);

        if (products.length !== productIds.length) {
            throw new Error('One or more products not found');
        }

        // STEP 3: Validate each product
        for (const product of products) {
            // Find matching item from request
            const item = items.find(i => i.productId === product.product_id);
            
            if (!item) {
                throw new Error(`Product ${product.product_id} not in order items`);
            }
            
            // Validate flash sale
            if (product.flash_sale_id && product.flash_end && new Date(product.flash_end) < new Date()) {
                throw new Error(`Flash sale has ended for ${product.product_name}`);
            }
            
            // Validate stock
            if (product.quantity_stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.product_name}. Available: ${product.quantity_stock}, Requested: ${item.quantity}`);
            }

            total += product.price * item.quantity;
            validatedProducts.push({ ...product, orderQuantity: item.quantity });
        }

        // STEP 4: Create order
        const [orderResult] = await connection.query(`
            INSERT INTO Orders (buyer_id, created_at) 
            VALUES (?, NOW())
        `, [userId]);

        const orderId = orderResult.insertId;

        // STEP 5: Insert order items and update stock (already locked, safe to update)
        for (const product of validatedProducts) {
            await connection.query(
                'INSERT INTO OrderItems (order_id, product_id, quantity_sold) VALUES (?, ?, ?)',
                [orderId, product.product_id, product.orderQuantity]
            );

            // Atomic stock reduction with double-check
            const [updateResult] = await connection.query(`
                UPDATE Products 
                SET quantity_stock = quantity_stock - ? 
                WHERE product_id = ? AND quantity_stock >= ?
            `, [product.orderQuantity, product.product_id, product.orderQuantity]);

            if (updateResult.affectedRows === 0) {
                throw new Error(`Stock update failed for ${product.product_name} (race condition detected)`);
            }
        }

        // STEP 6: Clear cart
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

// Get user orders (read-only, no locking needed)
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