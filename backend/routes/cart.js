const express = require('express');
const router = express.Router();
const { carts, products } = require('../data/store');

// Get user cart
router.get('/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userCart = carts[userId] || [];

    const cartWithDetails = userCart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
            ...item,
            product
        };
    });

    const total = cartWithDetails.reduce((sum, item) => 
        sum + (item.product.currentPrice * item.quantity), 0
    );

    res.json({
        success: true,
        data: {
            items: cartWithDetails,
            total,
            itemCount: userCart.reduce((sum, item) => sum + item.quantity, 0)
        }
    });
});

// Add to cart
router.post('/:userId/add', (req, res) => {
    const userId = parseInt(req.params.userId);
    const { productId, quantity = 1 } = req.body;

    if (!carts[userId]) {
        carts[userId] = [];
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    if (product.stock < quantity) {
        return res.status(400).json({
            success: false,
            message: 'Insufficient stock'
        });
    }

    const existingItem = carts[userId].find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        carts[userId].push({
            productId,
            quantity,
            addedAt: new Date().toISOString()
        });
    }

    res.json({
        success: true,
        message: 'Item added to cart',
        data: carts[userId]
    });
});

// Update cart item quantity
router.patch('/:userId/items/:productId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;

    if (!carts[userId]) {
        return res.status(404).json({
            success: false,
            message: 'Cart not found'
        });
    }

    const item = carts[userId].find(item => item.productId === productId);
    if (!item) {
        return res.status(404).json({
            success: false,
            message: 'Item not found in cart'
        });
    }

    const product = products.find(p => p.id === productId);
    if (product.stock < quantity) {
        return res.status(400).json({
            success: false,
            message: 'Insufficient stock'
        });
    }

    item.quantity = quantity;

    res.json({
        success: true,
        message: 'Cart updated',
        data: carts[userId]
    });
});

// Remove from cart
router.delete('/:userId/items/:productId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const productId = parseInt(req.params.productId);

    if (!carts[userId]) {
        return res.status(404).json({
            success: false,
            message: 'Cart not found'
        });
    }

    carts[userId] = carts[userId].filter(item => item.productId !== productId);

    res.json({
        success: true,
        message: 'Item removed from cart',
        data: carts[userId]
    });
});

// Clear cart
router.delete('/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    carts[userId] = [];

    res.json({
        success: true,
        message: 'Cart cleared'
    });
});

module.exports = router;
