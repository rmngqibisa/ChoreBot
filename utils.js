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

        // Cleanup interval (every minute)
        setInterval(() => this.cleanup(), 60000);
    }

    check(ip) {
        const now = Date.now();
        if (!this.requests.has(ip)) {
            this.requests.set(ip, { count: 1, startTime: now });
            return true;
        }

        const data = this.requests.get(ip);
        if (now - data.startTime > this.windowMs) {
            // Window expired, reset
            data.count = 1;
            data.startTime = now;
            return true;
        }

        if (data.count < this.limit) {
            data.count++;
            return true;
        }

        return false;
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, data] of this.requests.entries()) {
            if (now - data.startTime > this.windowMs) {
                this.requests.delete(ip);
            }
        }
    }
}

module.exports = { getDistanceFromLatLonInKm, deg2rad, RateLimiter };
