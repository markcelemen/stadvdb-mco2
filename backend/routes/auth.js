const express = require('express');
const router = express.Router();
const { users, carts } = require('../data/store');

// Register user
router.post('/register', (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User already exists'
        });
    }

    const newUser = {
        id: users.length + 1,
        email,
        name,
        password, // In production, hash this with bcrypt!
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    carts[newUser.id] = [];

    res.status(201).json({
        success: true,
        data: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name
        },
        message: 'User registered successfully'
    });
});

// Login user
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            name: user.name
        },
        message: 'Login successful'
    });
});

module.exports = router;