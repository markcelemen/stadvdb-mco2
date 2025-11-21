const express = require('express');
const router = express.Router();
const { orders, products, carts, orderCounter } = require('../data/store');

// Create order (checkout)
router.post('/', (req, res) => {
    const { userId, items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Cart is empty'
        });
    }

    // Check stock availability
    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock for ${product?.name || 'product'}`
            });
        }
    }

    // Calculate total and prepare order items
    let total = 0;
    const orderItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        const subtotal = product.currentPrice * item.quantity;
        total += subtotal;

        return {
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            price: product.currentPrice,
            subtotal
        };
    });

    // Update stock and sold count
    items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        product.stock -= item.quantity;
        product.sold += item.quantity;
    });

    // Create order
    const order = {
        id: orderCounter.increment(),
        userId,
        items: orderItems,
        total,
        shippingAddress,
        paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    orders.push(order);

    // Clear user's cart
    if (carts[userId]) {
        carts[userId] = [];
    }

    res.status(201).json({
        success: true,
        data: order,
        message: 'Order placed successfully'
    });
});

// Get user orders
router.get('/user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userOrders = orders.filter(o => o.userId === userId);

    res.json({
        success: true,
        data: userOrders,
        count: userOrders.length
    });
});

// Get single order
router.get('/:orderId', (req, res) => {
    const order = orders.find(o => o.id === parseInt(req.params.orderId));

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    res.json({
        success: true,
        data: order
    });
});

// Update order status
router.patch('/:orderId/status', (req, res) => {
    const { status } = req.body;
    const order = orders.find(o => o.id === parseInt(req.params.orderId));

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    res.json({
        success: true,
        data: order,
        message: 'Order status updated'
    });
});

module.exports = router;