const express = require('express');
const router = express.Router();
const { products } = require('../data/store');

// Get current flash sale
router.get('/current', (req, res) => {
    const flashSaleProducts = products.filter(p => p.isFlashSale);

    if (flashSaleProducts.length === 0) {
        return res.json({
            success: true,
            data: null,
            message: 'No active flash sale'
        });
    }

    res.json({
        success: true,
        data: {
            endTime: flashSaleProducts[0].flashSaleEnd,
            products: flashSaleProducts
        }
    });
});

module.exports = router;