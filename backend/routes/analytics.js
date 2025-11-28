const express = require('express');
const router = express.Router();
const analytics = require('../analytics'); 


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

// Route: Hourly Sales

router.get("/hourly-sales", async (req, res) => {
    try {
        const data = await analytics.getHourlySales(); 
        res.json({ success: true, data });
    } catch (err) {
        console.error("Hourly sales line API error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;