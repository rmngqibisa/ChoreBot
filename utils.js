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

module.exports = { getDistanceFromLatLonInKm, deg2rad };
