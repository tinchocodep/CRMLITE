/**
 * geocoding.js — Wrapper around Nominatim (OpenStreetMap) for address search.
 * Using a wrapper ensures we only need to change this file if we switch providers.
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Search for an address using Nominatim.
 * @param {string} query - The address string to search for
 * @param {object} options - Additional options
 * @param {number} options.limit - Max results (default 8)
 * @param {string} options.countrycodes - Comma-separated ISO country codes (e.g. 'ar')
 * @returns {Promise<Array>} Array of normalized result objects
 */
export const searchAddress = async (query, { limit = 8, countrycodes = '' } = {}) => {
    const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: String(limit),
        ...(countrycodes && { countrycodes }),
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
        headers: {
            // Nominatim requires a descriptive User-Agent
            'User-Agent': 'CRMLITE/1.0 (contact@crmlite.app)',
            'Accept-Language': 'es',
        },
    });

    if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize the response shape
    return data.map(item => ({
        id: item.place_id,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        address: item.address || {},
        boundingBox: item.boundingbox
            ? {
                south: parseFloat(item.boundingbox[0]),
                north: parseFloat(item.boundingbox[1]),
                west: parseFloat(item.boundingbox[2]),
                east: parseFloat(item.boundingbox[3]),
            }
            : null,
    }));
};

/**
 * Reverse geocode: given lat/lon, returns a human-readable address string.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string>} Display name of the location
 */
export const reverseGeocode = async (lat, lon) => {
    const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: 'json',
        addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
        headers: {
            'User-Agent': 'CRMLITE/1.0 (contact@crmlite.app)',
            'Accept-Language': 'es',
        },
    });

    if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.status}`);
    }

    const data = await response.json();
    return data.display_name || '';
};
