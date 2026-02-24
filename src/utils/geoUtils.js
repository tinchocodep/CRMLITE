/**
 * geoUtils.js — Geographic calculation utilities.
 * Wraps area calculations so we can swap the underlying library if needed.
 * Uses the Shoelace formula (Gauss's area formula) adapted for geographic coordinates,
 * converting degrees to meters with Earth's radius approximation.
 */

const EARTH_RADIUS_M = 6371000; // meters

/**
 * Converts degrees to radians.
 */
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Calculates the area of a GeoJSON Feature or Geometry in hectares.
 * Supports Polygon and MultiPolygon geometry types.
 *
 * The calculation uses the spherical excess formula (similar to Turf.js area())
 * but without the external dependency.
 *
 * @param {object} geojson - A GeoJSON Feature or Geometry object
 * @returns {number} Area in hectares
 */
export const calculateAreaInHectares = (geojson) => {
    try {
        const geometry = geojson?.geometry ?? geojson;
        if (!geometry) return 0;

        let squareMeters = 0;

        if (geometry.type === 'Polygon') {
            squareMeters = polygonArea(geometry.coordinates);
        } else if (geometry.type === 'MultiPolygon') {
            squareMeters = geometry.coordinates.reduce(
                (sum, polygonCoords) => sum + polygonArea(polygonCoords),
                0
            );
        }

        // 1 hectare = 10,000 m²
        return squareMeters / 10000;
    } catch (err) {
        console.error('Error calculating area:', err);
        return 0;
    }
};

/**
 * Calculates area for a polygon's coordinate rings.
 * The first ring is the outer boundary; subsequent rings are holes (subtracted).
 *
 * @param {number[][][]} rings - Array of coordinate rings [[lng, lat], ...]
 * @returns {number} Area in square meters
 */
const polygonArea = (rings) => {
    if (!rings || rings.length === 0) return 0;

    // Outer ring area minus hole areas
    const outerArea = ringArea(rings[0]);
    const holesArea = rings.slice(1).reduce((sum, ring) => sum + ringArea(ring), 0);
    return Math.abs(outerArea) - Math.abs(holesArea);
};

/**
 * Computes area of a single coordinate ring using the spherical excess formula.
 * Based on: https://trs.jpl.nasa.gov/handle/2014/40409
 *
 * @param {number[][]} coords - Array of [lng, lat] pairs
 * @returns {number} Signed area in square meters
 */
const ringArea = (coords) => {
    const n = coords.length;
    if (n < 3) return 0;

    let area = 0;

    for (let i = 0; i < n - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];

        area +=
            toRad(p2[0] - p1[0]) *
            (2 + Math.sin(toRad(p1[1])) + Math.sin(toRad(p2[1])));
    }

    area = Math.abs((area * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
    return area;
};

/**
 * Given a GeoJSON Polygon geometry, returns the centroid [lat, lng].
 * Simple average of all coordinates — sufficient for map fly-to.
 *
 * @param {object} geometry - GeoJSON Geometry (Polygon or MultiPolygon)
 * @returns {[number, number]} [lat, lng]
 */
export const getCentroid = (geometry) => {
    try {
        const ring = geometry?.type === 'MultiPolygon'
            ? geometry.coordinates[0][0]
            : geometry?.coordinates?.[0];

        if (!ring || ring.length === 0) return null;

        const lat = ring.reduce((sum, c) => sum + c[1], 0) / ring.length;
        const lng = ring.reduce((sum, c) => sum + c[0], 0) / ring.length;
        return [lat, lng];
    } catch {
        return null;
    }
};
