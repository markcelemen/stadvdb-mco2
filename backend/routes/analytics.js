const express = require('express');
const router = express.Router();
const analytics = require('../analytics'); 

// Top 10 Selling Items
router.get('/top-products', async (req, res) => {
    const sellerId = Number(req.query.sellerId);
    if (!sellerId) return res.status(400).json({ success: false, message: 'Missing sellerId' });

    try {
        const data = await analytics.getTop10SellingItems(sellerId);
        res.json({ success: true, report: 'Top 10 Selling Items', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Sales by Category
router.get('/sales-by-category', async (req, res) => {
    const sellerId = Number(req.query.sellerId);
    if (!sellerId) return res.status(400).json({ success: false, message: 'Missing sellerId' });

    try {
        const data = await analytics.getSalesByCategory(sellerId);
        res.json({ success: true, report: 'Sales by Category', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Hourly Sales
router.get('/hourly-sales', async (req, res) => {
    const sellerId = Number(req.query.sellerId);
    if (!sellerId) return res.status(400).json({ success: false, message: 'Missing sellerId' });

    try {
        const data = await analytics.getHourlySales(sellerId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;