const express = require('express');
const router = express.Router();
const analytics = require('../analytics'); // import your analytics.js functions


// Route: Top 10 Selling Items

router.get('/top-products', async (req, res) => {
    try {
        const data = await analytics.getTop10SellingItems();
        res.json({
            success: true,
            report: 'Top 10 Selling Items',
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Top 10 Selling Items',
            error: error.message
        });
    }
});

// Route: Sales by Category

router.get('/sales-by-category', async (req, res) => {
    try {
        const data = await analytics.getSalesByCategory();
        res.json({
            success: true,
            report: 'Sales by Category',
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Sales by Category',
            error: error.message
        });
    }
});


// Route: Flash Sale Performance

router.get('/flash-sale/:id', async (req, res) => {
    const flashSaleId = req.params.id;
    try {
        const data = await analytics.getFlashSalePerformance(flashSaleId);
        res.json({
            success: true,
            report: `Flash Sale Performance for ID ${flashSaleId}`,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Flash Sale Performance',
            error: error.message
        });
    }
});

module.exports = router;