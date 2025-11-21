const express = require('express');
const router = express.Router();
const { products } = require('../data/store');

// Get all products
router.get('/', (req, res) => {
    const { category, search, flashSale } = req.query;
    let filteredProducts = [...products];

    if (category) {
        filteredProducts = filteredProducts.filter(p => 
            p.category.toLowerCase() === category.toLowerCase()
        );
    }

    if (search) {
        filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    if (flashSale === 'true') {
        filteredProducts = filteredProducts.filter(p => p.isFlashSale);
    }

    res.json({
        success: true,
        data: filteredProducts,
        count: filteredProducts.length
    });
});

// Get single product
router.get('/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    res.json({
        success: true,
        data: product
    });
});

// Update product stock
router.patch('/:id/stock', (req, res) => {
    const { quantity } = req.body;
    const product = products.find(p => p.id === parseInt(req.params.id));

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    product.stock += quantity;

    res.json({
        success: true,
        data: product,
        message: 'Stock updated successfully'
    });
});

module.exports = router;