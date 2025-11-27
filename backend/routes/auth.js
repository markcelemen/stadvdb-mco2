const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Register user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!['SELLER', 'BUYER'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be SELLER or BUYER'
            });
        }

        // Check if user already exists
        const [existing] = await pool.query(
            'SELECT user_id FROM Users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Insert new user (In production, hash password with bcrypt!)
        const [result] = await pool.query(
            'INSERT INTO Users (user_name, email, user_pw, user_role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );

        const [newUser] = await pool.query(
            'SELECT user_id, user_name, email, user_role FROM Users WHERE user_id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            data: {
                id: newUser[0].user_id,
                name: newUser[0].user_name,
                email: newUser[0].email,
                role: newUser[0].user_role
            },
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user (In production, compare hashed passwords!)
        const [users] = await pool.query(
            'SELECT user_id, user_name, email, user_role FROM Users WHERE email = ? AND user_pw = ?',
            [email, password]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        res.json({
            success: true,
            data: {
                id: user.user_id,
                name: user.user_name,
                email: user.email,
                role: user.user_role
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

module.exports = router;