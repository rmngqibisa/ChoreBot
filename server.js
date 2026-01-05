const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data
const users = [];
const providers = [];
const chores = [];

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

// Helper function to calculate distance (Haversine Formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
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
                // Do not return salt/hash in response
                const { salt: _, hash: __, ...userResponse } = user;
                res.json({ message: 'Login successful', user: userResponse });
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
app.post('/api/chores', (req, res) => {
    const { title, description, payment, userId, latitude, longitude } = req.body;
    if (!title || !description || !payment || !userId) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const chore = {
        id: crypto.randomUUID(),
        title,
        description,
        payment,
        userId,
        status: 'pending', // pending, paid, assigned, completed
        assignedTo: null,
        latitude,
        longitude
    };

    chores.push(chore);
    res.status(201).json({ message: 'Chore created', chore });
});

// Pay for Chore (Confirm Payment)
app.post('/api/chores/:id/pay', (req, res) => {
    const { id } = req.params;
    const chore = chores.find(c => c.id === id);
    if (!chore) return res.status(404).json({ error: 'Chore not found' });

    chore.status = 'paid';
    res.json({ message: 'Payment confirmed', chore });
});

// Get Chores (filtered by user or location)
app.get('/api/chores', (req, res) => {
    const { latitude, longitude, userId } = req.query;

    if (userId) {
        // If userId is provided, return all chores for that user (User Dashboard)
        const userChores = chores.filter(c => c.userId === userId);
        return res.json(userChores);
    }

    // Otherwise, return available chores for providers
    let availableChores = chores.filter(c => c.status === 'paid');

    if (latitude && longitude) {
        const providerLat = parseFloat(latitude);
        const providerLon = parseFloat(longitude);

        availableChores = availableChores.filter(c => {
            if (c.latitude && c.longitude) {
                // Optimization: Simple Bounding Box check
                // 1 deg lat ~= 111km. 10km ~= 0.09 deg.
                // If lat diff is > 0.1, it's definitely > 10km away.
                // This avoids expensive Trig calculations for distant points.
                if (Math.abs(providerLat - c.latitude) > 0.1) return false;

                const dist = getDistanceFromLatLonInKm(providerLat, providerLon, c.latitude, c.longitude);
                return dist <= 10; // 10 km radius
            }
            return true; // If chore has no location, maybe show it? Or assume it's global? Let's show it.
        });
    }

    res.json(availableChores);
});

// Assign Chore
app.post('/api/chores/:id/assign', (req, res) => {
    const { id } = req.params;
    const { providerId } = req.body;

    const chore = chores.find(c => c.id === id);
    if (!chore) return res.status(404).json({ error: 'Chore not found' });
    if (chore.status !== 'paid') return res.status(400).json({ error: 'Chore is not available (must be paid first)' });

    chore.assignedTo = providerId;
    chore.status = 'assigned';
    res.json({ message: 'Chore assigned', chore });
});

// Complete Chore
app.post('/api/chores/:id/complete', (req, res) => {
    const { id } = req.params;
    const chore = chores.find(c => c.id === id);
    if (!chore) return res.status(404).json({ error: 'Chore not found' });

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
