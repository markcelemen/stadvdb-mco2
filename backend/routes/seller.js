const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all products posted by the seller
router.get('/products', async (req, res) => {
    try {
        const sellerId = req.query.sellerId; // Get sellerId from query params
        
        if (!sellerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'sellerId query parameter is required' 
            });
        }

        const [products] = await pool.query(`
            SELECT 
                p.product_id as id,
                p.product_name as name,
                p.category,
                p.product_desc as \`desc\`,
                p.price as currentPrice,
                p.original_price as originalPrice,
                p.discount_rate as discount,
                p.quantity_stock as stock,
                p.flash_sale_id,
                p.seller_id,
                CASE WHEN p.flash_sale_id IS NOT NULL THEN 1 ELSE 0 END as isFlashSale,
                fs.end_time as flashSaleEnd
            FROM Products p
            LEFT JOIN FlashSales fs ON p.flash_sale_id = fs.flash_sale_id
            WHERE p.seller_id = ?
            ORDER BY p.product_id DESC
        `, [parseInt(sellerId)]);
        
        res.json({ success: true, products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET all orders sent to the seller (orders containing seller's products)
router.get('/orders', async (req, res) => {
    try {
        const sellerId = req.query.sellerId; // Get sellerId from query params
        
        if (!sellerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'sellerId query parameter is required' 
            });
        }

        // Get orders that contain products from this seller
        const [orders] = await pool.query(`
            SELECT DISTINCT
                o.order_id as id,
                o.order_id as number,
                o.created_at,
                u.user_name as customer,
                GROUP_CONCAT(DISTINCT p.product_name SEPARATOR ', ') as product,
                SUM(oi.quantity_sold * p.price) as total
            FROM Orders o
            JOIN Users u ON o.buyer_id = u.user_id
            JOIN OrderItems oi ON o.order_id = oi.order_id
            JOIN Products p ON oi.product_id = p.product_id
            WHERE p.seller_id = ?
            GROUP BY o.order_id, u.user_name, o.created_at
            ORDER BY o.created_at DESC
        `, [parseInt(sellerId)]);

        // Fetch order items for each order (only seller's products)
        for (let order of orders) {
            const [items] = await pool.query(`
                SELECT 
                    p.product_name as name,
                    oi.quantity_sold as quantity,
                    oi.quantity_sold as qty,
                    p.price
                FROM OrderItems oi
                JOIN Products p ON oi.product_id = p.product_id
                WHERE oi.order_id = ? AND p.seller_id = ?
            `, [order.id, parseInt(sellerId)]);
            
            order.items = items;
        }

        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET all flash sales posted by the seller
router.get('/flash-sales', async (req, res) => {
    try {
        const sellerId = req.query.sellerId;
        
        if (!sellerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'sellerId query parameter is required' 
            });
        }

        // Get flash sales that contain at least one product from this seller
        const [flashSales] = await pool.query(`
            SELECT DISTINCT
                fs.flash_sale_id as id,
                fs.name,
                fs.start_time,
                fs.end_time
            FROM FlashSales fs
            JOIN Products p ON fs.flash_sale_id = p.flash_sale_id
            WHERE p.seller_id = ?
            ORDER BY fs.start_time DESC
        `, [parseInt(sellerId)]);

        // Get seller's products for each flash sale
        for (let sale of flashSales) {
            const [products] = await pool.query(`
                SELECT product_id as id
                FROM Products
                WHERE flash_sale_id = ? AND seller_id = ?
            `, [sale.id, parseInt(sellerId)]);
            
            sale.products = products.map(p => p.id);
        }

        res.json({ success: true, flashSales });
    } catch (error) {
        console.error('Error fetching flash sales:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST add new product by seller
router.post('/products', async (req, res) => {
    try {
        const { name, category, originalPrice, price, discount, stock, image, desc, sellerId } = req.body;
        
        if (!name || price === undefined || stock === undefined || !sellerId) {
            return res.status(400).json({ success: false, message: 'Missing required fields (name, price, stock, sellerId)' });
        }

        const [result] = await pool.query(`
            INSERT INTO Products 
            (seller_id, product_name, category, product_desc, price, original_price, discount_rate, quantity_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            parseInt(sellerId),
            name,
            category || 'General',
            desc || null,
            parseFloat(price),
            originalPrice ? parseFloat(originalPrice) : parseFloat(price),
            discount || 0,
            parseInt(stock)
        ]);

        const [newProduct] = await pool.query(`
            SELECT 
                product_id as id,
                product_name as name,
                category,
                product_desc as \`desc\`,
                price as currentPrice,
                original_price as originalPrice,
                discount_rate as discount,
                quantity_stock as stock,
                seller_id
            FROM Products
            WHERE product_id = ?
        `, [result.insertId]);

        res.status(201).json({ success: true, product: newProduct[0] });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT edit product by seller
router.put('/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { name, category, originalPrice, price, discount, stock, image, desc, sellerId } = req.body;

        if (!sellerId) {
            return res.status(400).json({ success: false, message: 'sellerId is required' });
        }

        // Verify product belongs to seller
        const [existing] = await pool.query(
            'SELECT product_id FROM Products WHERE product_id = ? AND seller_id = ?',
            [productId, parseInt(sellerId)]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found or not owned by seller' });
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push('product_name = ?');
            values.push(name);
        }
        if (category) {
            updates.push('category = ?');
            values.push(category);
        }
        if (desc !== undefined) {
            updates.push('product_desc = ?');
            values.push(desc);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            values.push(parseFloat(price));
        }
        if (originalPrice !== undefined) {
            updates.push('original_price = ?');
            values.push(parseFloat(originalPrice));
        }
        if (discount !== undefined) {
            updates.push('discount_rate = ?');
            values.push(discount);
        }
        if (stock !== undefined) {
            updates.push('quantity_stock = ?');
            values.push(parseInt(stock));
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(productId);

        await pool.query(`
            UPDATE Products 
            SET ${updates.join(', ')}
            WHERE product_id = ?
        `, values);

        const [updatedProduct] = await pool.query(`
            SELECT 
                product_id as id,
                product_name as name,
                category,
                product_desc as \`desc\`,
                price as currentPrice,
                original_price as originalPrice,
                discount_rate as discount,
                quantity_stock as stock,
                seller_id
            FROM Products
            WHERE product_id = ?
        `, [productId]);

        res.json({ success: true, product: updatedProduct[0] });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE product by seller
router.delete('/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const sellerId = req.query.sellerId;

        if (!sellerId) {
            return res.status(400).json({ success: false, message: 'sellerId query parameter is required' });
        }

        // Verify product belongs to seller before deleting
        const [result] = await pool.query(`
            DELETE FROM Products 
            WHERE product_id = ? AND seller_id = ?
        `, [productId, parseInt(sellerId)]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Product not found or not owned by seller' });
        }

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE order sent to seller (only delete order items for seller's products)
router.delete('/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const sellerId = req.query.sellerId;

        if (!sellerId) {
            return res.status(400).json({ success: false, message: 'sellerId query parameter is required' });
        }

        // Delete only order items that belong to this seller
        const [result] = await pool.query(`
            DELETE oi FROM OrderItems oi
            JOIN Products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ? AND p.seller_id = ?
        `, [orderId, parseInt(sellerId)]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'No order items found for this seller' });
        }

        // Check if order has no more items, if so delete the order
        const [remainingItems] = await pool.query(
            'SELECT COUNT(*) as count FROM OrderItems WHERE order_id = ?',
            [orderId]
        );

        if (remainingItems[0].count === 0) {
            await pool.query('DELETE FROM Orders WHERE order_id = ?', [orderId]);
        }

        res.json({ success: true, message: 'Order items deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST flash sale with seller's products
router.post('/flash-sales', async (req, res) => {
    try {
        const { name, startTime, endTime, productIds, sellerId } = req.body;

        if (!name || !startTime || !endTime || !sellerId) {
            return res.status(400).json({ success: false, message: 'Missing required fields (name, startTime, endTime, sellerId)' });
        }

        // Insert flash sale
        const [result] = await pool.query(`
            INSERT INTO FlashSales (name, start_time, end_time)
            VALUES (?, ?, ?)
        `, [name, new Date(startTime), new Date(endTime)]);

        const flashSaleId = result.insertId;

        // Update only seller's products to associate with flash sale
        if (productIds && productIds.length > 0) {
            const placeholders = productIds.map(() => '?').join(',');
            await pool.query(`
                UPDATE Products 
                SET flash_sale_id = ?
                WHERE product_id IN (${placeholders}) AND seller_id = ?
            `, [flashSaleId, ...productIds.map(id => parseInt(id)), parseInt(sellerId)]);
        }

        const [flashSale] = await pool.query(`
            SELECT 
                flash_sale_id as id,
                name,
                start_time,
                end_time
            FROM FlashSales
            WHERE flash_sale_id = ?
        `, [flashSaleId]);

        res.status(201).json({ 
            success: true, 
            flashSale: { ...flashSale[0], products: productIds || [] }
        });
    } catch (error) {
        console.error('Error creating flash sale:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE flash sale (only removes seller's products from it)
router.delete('/flash-sales/:id', async (req, res) => {
    try {
        const flashSaleId = parseInt(req.params.id);
        const sellerId = req.query.sellerId;

        if (!sellerId) {
            return res.status(400).json({ success: false, message: 'sellerId query parameter is required' });
        }

        // Remove flash sale association only from seller's products
        const [result] = await pool.query(`
            UPDATE Products 
            SET flash_sale_id = NULL
            WHERE flash_sale_id = ? AND seller_id = ?
        `, [flashSaleId, parseInt(sellerId)]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'No products found in this flash sale for this seller' });
        }

        // Check if flash sale has any remaining products
        const [remainingProducts] = await pool.query(
            'SELECT COUNT(*) as count FROM Products WHERE flash_sale_id = ?',
            [flashSaleId]
        );

        // If no products left in flash sale, delete the flash sale
        if (remainingProducts[0].count === 0) {
            await pool.query('DELETE FROM FlashSales WHERE flash_sale_id = ?', [flashSaleId]);
        }

        res.json({ success: true, message: 'Flash sale updated successfully' });
    } catch (error) {
        console.error('Error deleting flash sale:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;