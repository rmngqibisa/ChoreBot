const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const { getDistanceFromLatLonInKm, deg2rad } = require('./utils');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data
const users = [];
const providers = [];
// Optimization: Use Map for O(1) access by ID instead of Array.find() which is O(N)
const chores = new Map();
const sessions = new Map();

// Authentication Middleware
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    const session = sessions.get(token);
    if (!session) return res.status(401).json({ error: 'Unauthorized: Invalid token' });

    req.user = session; // { id, type }
    next();
}

// Helper function to hash passwords
function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            resolve({ salt, hash: derivedKey.toString('hex') });
        });
    });
}

// Helper function to verify passwords
function verifyPassword(password, salt, hash) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            resolve(hash === derivedKey.toString('hex'));
        });
    });
}

// Routes

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, password, type, address, latitude, longitude } = req.body;
    // Simple validation
    if (!name || !email || !password || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = crypto.randomUUID();

    // Hash the password
    try {
        const { salt, hash } = await hashPassword(password);

        const newUser = { id, name, email, salt, hash, type, address, latitude, longitude };

        if (type === 'user') {
            users.push(newUser);
        } else if (type === 'provider') {
            providers.push(newUser);
        } else {
            return res.status(400).json({ error: 'Invalid type' });
        }

        // Do not return salt/hash in response
        const { salt: _, hash: __, ...userResponse } = newUser;
        res.status(201).json({ message: 'Registration successful', user: userResponse });
    } catch (err) {
        res.status(500).json({ error: 'Error hashing password' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password, type } = req.body;
    let user;
    if (type === 'user') {
        user = users.find(u => u.email === email);
    } else {
        user = providers.find(u => u.email === email);
    }

    if (user) {
        try {
            const isValid = await verifyPassword(password, user.salt, user.hash);
            if (isValid) {
                // Create session
                const token = crypto.randomUUID();
                sessions.set(token, { id: user.id, type: user.type });

                // Do not return salt/hash in response
                const { salt: _, hash: __, ...userResponse } = user;
                res.json({ message: 'Login successful', user: { ...userResponse, token } });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (err) {
            res.status(500).json({ error: 'Error verifying password' });
        }
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Create Chore
app.post('/api/chores', authenticate, (req, res) => {
    const { title, description, payment, latitude, longitude } = req.body;

    if (req.user.type !== 'user') return res.status(403).json({ error: 'Only users can create chores' });

    if (!title || !description || !payment) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const chore = {
        id: crypto.randomUUID(),
        title,
        description,
        payment,
        userId: req.user.id,
        status: 'pending', // pending, paid, assigned, completed
        assignedTo: null,
        latitude,
        longitude
    };

    chores.set(chore.id, chore);
    res.status(201).json({ message: 'Chore created', chore });
});

// Pay for Chore (Confirm Payment)
app.post('/api/chores/:id/pay', authenticate, (req, res) => {
    const { id } = req.params;
    // O(1) lookup
    const chore = chores.get(id);
    if (!chore) return res.status(404).json({ error: 'Chore not found' });

    if (chore.userId !== req.user.id) return res.status(403).json({ error: 'Not your chore' });

    chore.status = 'paid';
    res.json({ message: 'Payment confirmed', chore });
});

// Get Chores (filtered by user or location)
app.get('/api/chores', authenticate, (req, res) => {
    const { latitude, longitude, userId } = req.query;

    if (userId) {
        // Ensure user is requesting their own chores
        if (userId !== req.user.id) return res.status(403).json({ error: 'Cannot view other users chores' });

        const userChores = [];
        for (const c of chores.values()) {
            if (c.userId === userId) {
                userChores.push(c);
            }
        }
        return res.json(userChores);
    }

    // Otherwise, return available chores for providers
    // Optimization: Combined loop + Longitude bounding box check
    // We combine the status filter and location filter to iterate once.

    let providerLat, providerLon, latRad, lonThreshold;
    if (latitude && longitude) {
        providerLat = parseFloat(latitude);
        providerLon = parseFloat(longitude);
        latRad = deg2rad(providerLat);
        // Longitude threshold depends on latitude.
        // 1 deg lon at lat L = 111km * cos(L).
        // We want ~10km. Threshold = 10 / (111 * cos(L)) ~= 0.09 / cos(L).
        // Added small buffer (0.12) to be safe.
        // Cap at 180 (if near pole, check everything).
        const cosLat = Math.abs(Math.cos(latRad));
        lonThreshold = cosLat < 0.01 ? 180 : 0.12 / cosLat;
    }

    const availableChores = [];
    for (const c of chores.values()) {
        if (c.status !== 'paid') continue;

        if (providerLat !== undefined && providerLon !== undefined) {
            if (c.latitude && c.longitude) {
                // Latitude Check
                if (Math.abs(providerLat - c.latitude) > 0.1) continue;

                // Longitude Check (Handle wrapping)
                let dLon = Math.abs(providerLon - c.longitude);
                if (dLon > 180) dLon = 360 - dLon;
                if (dLon > lonThreshold) continue;

                // Accurate Check
                const dist = getDistanceFromLatLonInKm(providerLat, providerLon, c.latitude, c.longitude);
                if (dist > 10) continue;
            }
            // If chore has no location, include it (global/remote chore)
        }
        availableChores.push(c);
    }

    res.json(availableChores);
});

// Assign Chore
app.post('/api/chores/:id/assign', authenticate, (req, res) => {
    const { id } = req.params;

    if (req.user.type !== 'provider') return res.status(403).json({ error: 'Only providers can accept chores' });

    const chore = chores.get(id);
    if (!chore) return res.status(404).json({ error: 'Chore not found' });
    if (chore.status !== 'paid') return res.status(400).json({ error: 'Chore is not available (must be paid first)' });

    chore.assignedTo = req.user.id;
    chore.status = 'assigned';
    res.json({ message: 'Chore assigned', chore });
});

// Complete Chore
app.post('/api/chores/:id/complete', authenticate, (req, res) => {
    const { id } = req.params;
    const chore = chores.get(id);
    if (!chore) return res.status(404).json({ error: 'Chore not found' });

    // Only allow provider or owner to mark complete? Usually provider marks complete, user confirms?
    // For now, let's say provider marks complete.
    if (chore.assignedTo !== req.user.id) return res.status(403).json({ error: 'Not assigned to you' });

    chore.status = 'completed';
    // Logic to release payment to provider would go here
    res.json({ message: 'Chore completed', chore });
});

// Basic Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = { app, users, providers, chores, getDistanceFromLatLonInKm };
