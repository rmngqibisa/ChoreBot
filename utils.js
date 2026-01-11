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
    constructor(limit = 100, windowMs = 900000) { // Default 100 reqs per 15 mins
        this.limit = limit;
        this.windowMs = windowMs;
        this.requests = new Map(); // ip -> { count, startTime }

        // Auto cleanup every minute
        setInterval(() => this.cleanup(), 60000).unref();
    }

    check(ip) {
        const now = Date.now();
        const record = this.requests.get(ip);

        if (!record) {
            this.requests.set(ip, { count: 1, startTime: now });
            return true;
        }

        if (now - record.startTime > this.windowMs) {
            // Window expired, reset
            this.requests.set(ip, { count: 1, startTime: now });
            return true;
        }

        if (record.count >= this.limit) {
            return false;
        }

        record.count++;
        return true;
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, record] of this.requests.entries()) {
            if (now - record.startTime > this.windowMs) {
                this.requests.delete(ip);
            }
        }
    }
}

module.exports = { getDistanceFromLatLonInKm, deg2rad, RateLimiter };
