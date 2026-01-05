## 2025-02-18 - In-Memory Spatial Filtering
**Learning:** When filtering geospatial data in-memory (without a database index), computing Haversine distance for every point is a bottleneck. A dynamic "bounding box" check, including a longitude threshold adjusted for latitude (`deltaLon = const / cos(lat)`), significantly reduces the number of expensive trigonometric calls.
**Action:** Always apply bounding box pre-checks before expensive distance calculations in iterative loops. Pre-calculate the bounding box dimensions based on the query point once, outside the loop.
