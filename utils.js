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

    // Cleanup every minute
    setInterval(() => this.cleanup(), 60000).unref();
  }

  check(key) {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record) {
      this.requests.set(key, { count: 1, startTime: now });
      return true;
    }

    if (now - record.startTime > this.windowMs) {
      // Reset if window passed
      record.count = 1;
      record.startTime = now;
      return true;
    }

    if (record.count < this.limit) {
      record.count++;
      return true;
    }

    return false;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now - record.startTime > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }
}

module.exports = { getDistanceFromLatLonInKm, deg2rad, RateLimiter };
