// Helper function to calculate distance
// Uses Equirectangular approximation for performance (sufficient for small distances like < 500km)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const x = deg2rad(lon2 - lon1) * Math.cos(deg2rad((lat1 + lat2) / 2));
    const y = deg2rad(lat2 - lat1);
    const d = Math.sqrt(x * x + y * y) * R;
    return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

// Simple in-memory Rate Limiter
class RateLimiter {
    constructor(windowMs, maxRequests) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.requests = new Map();

        // Cleanup interval to prevent memory leaks
        setInterval(() => this.cleanup(), 60000);
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, data] of this.requests.entries()) {
            if (now - data.startTime > this.windowMs) {
                this.requests.delete(ip);
            }
        }
    }

    middleware() {
        return (req, res, next) => {
            const ip = req.ip;
            const now = Date.now();

            if (!this.requests.has(ip)) {
                this.requests.set(ip, { count: 1, startTime: now });
                return next();
            }

            const requestData = this.requests.get(ip);

            if (now - requestData.startTime > this.windowMs) {
                // Reset window
                requestData.count = 1;
                requestData.startTime = now;
                return next();
            }

            if (requestData.count >= this.maxRequests) {
                return res.status(429).json({ error: 'Too many requests, please try again later.' });
            }

            requestData.count++;
            next();
        };
    }
}

module.exports = { getDistanceFromLatLonInKm, deg2rad, RateLimiter };
