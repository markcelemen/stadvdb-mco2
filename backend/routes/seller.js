const express = require('express');
const router = express.Router();
const { products, orders, orderCounter } = require('../data/store');
const pool = require('../db/pool');

// GET all products for seller
router.get('/products', (req, res) => {
    try {
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET all orders for seller
router.get('/orders', (req, res) => {
    try {
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET all flash sales
router.get('/flash-sales', (req, res) => {
    try {
        const flashSales = products.filter(p => p.isFlashSale);
        res.json({ success: true, flashSales });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST add new product
router.post('/products', (req, res) => {
    try {
        const { name, category, originalPrice, price, discount, stock, image, desc } = req.body;
        
        if (!name || !price || stock === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name,
            category: category || 'General',
            currentPrice: parseFloat(price),
            originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
            discount: discount || 0,
            stock: parseInt(stock),
            sold: 0,
            image: image || '/images/placeholder.jpg',
            isFlashSale: false,
            flashSaleEnd: null
        };

        products.push(newProduct);
        res.status(201).json({ success: true, product: newProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT edit product
router.put('/products/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const { name, category, originalPrice, price, discount, stock, image, desc } = req.body;

        products[productIndex] = {
            ...products[productIndex],
            name: name || products[productIndex].name,
            category: category || products[productIndex].category,
            currentPrice: price ? parseFloat(price) : products[productIndex].currentPrice,
            originalPrice: originalPrice ? parseFloat(originalPrice) : products[productIndex].originalPrice,
            discount: discount !== undefined ? discount : products[productIndex].discount,
            stock: stock !== undefined ? parseInt(stock) : products[productIndex].stock,
            image: image || products[productIndex].image
        };

        res.json({ success: true, product: products[productIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE product
router.delete('/products/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        products.splice(productIndex, 1);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE order
router.delete('/orders/:id', (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        orders.splice(orderIndex, 1);
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST add flash sale
router.post('/flash-sales', (req, res) => {
    try {
        const { name, startTime, endTime, productIds } = req.body;

        if (!name || !startTime || !endTime || !productIds || !Array.isArray(productIds)) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Update selected products to be part of flash sale
        productIds.forEach(id => {
            const product = products.find(p => p.id === parseInt(id));
            if (product) {
                product.isFlashSale = true;
                product.flashSaleEnd = new Date(endTime).toISOString();
            }
        });

        const flashSale = {
            id: Date.now(),
            name,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            products: productIds.map(id => parseInt(id))
        };

        res.status(201).json({ success: true, flashSale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE flash sale
router.delete('/flash-sales/:id', (req, res) => {
    try {
        const flashSaleId = parseInt(req.params.id);

        // Remove flash sale status from all products
        products.forEach(product => {
            if (product.isFlashSale) {
                product.isFlashSale = false;
                product.flashSaleEnd = null;
            }
        });

        res.json({ success: true, message: 'Flash sale deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;