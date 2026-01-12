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

class RateLimiter {
    constructor(limit, windowMs) {
        this.limit = limit;
        this.windowMs = windowMs;
        this.requests = new Map();
        // Automatic cleanup every minute
        this.interval = setInterval(() => this.cleanup(), 60000);
        // Unref to prevent blocking process exit if needed (though not critical for server)
        if (this.interval.unref) this.interval.unref();
    }

    middleware() {
        return (req, res, next) => {
            // Use req.ip which Express handles based on 'trust proxy' setting
            // Note: If behind a proxy, ensure 'trust proxy' is enabled in the app
            const ip = req.ip || req.socket.remoteAddress;

            const now = Date.now();
            const record = this.requests.get(ip);

            if (!record || now > record.expiry) {
                this.requests.set(ip, { count: 1, expiry: now + this.windowMs });
                return next();
            }

            if (record.count >= this.limit) {
                return res.status(429).json({ error: 'Too many requests, please try again later.' });
            }

            record.count++;
            next();
        };
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, record] of this.requests) {
            if (now > record.expiry) {
                this.requests.delete(ip);
            }
        }
    }
}

module.exports = { getDistanceFromLatLonInKm, deg2rad, RateLimiter };
