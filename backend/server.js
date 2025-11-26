const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const analyticsRoutes = require('./routes/analytics');  // <-- THIS

app.use(cors());
app.use(express.json());

// MOUNT THE ROUTE
app.use('/api/analytics', analyticsRoutes);

// Also mount other routes
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/auth', require('./routes/auth'));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback for frontend routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(3000, () =>
    console.log("Server running on http://localhost:3000")
);
