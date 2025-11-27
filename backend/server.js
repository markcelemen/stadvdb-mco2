const express = require('express');
const app = express();
const cors = require('cors');
const analyticsRoutes = require('./routes/analytics');  // <-- THIS
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const PORT = process.env.PORT || 3000;

const setupDatabase = require('./db/setup');

// Import routes
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics'); // uncommented
const flashSaleRoutes = require('./routes/flashSales');
const sellerRoutes = require('./routes/seller');

app.use(cors());
app.use(express.json());

// MOUNT THE ROUTE
app.use('/api/analytics', analyticsRoutes);
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes); // uncommented
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/seller', sellerRoutes);

// Serve seller dashboard
app.get('/seller', (req, res) => {
    res.sendFile('seller_view.html', { root: path.join(__dirname, '../frontend') });
});

// Also mount other routes
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/auth', require('./routes/auth'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Fallback for frontend routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`FlashSale API Server running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
    console.log(`Frontend URL: http://localhost:${PORT}`);
    setupDatabase();
});
