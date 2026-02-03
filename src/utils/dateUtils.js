// Utility function to safely format dates
// Use this instead of date-fns format() directly to prevent "Invalid time value" errors

import { format as dateFnsFormat } from 'date-fns';

/**
 * Safely format a date, returning a fallback string if the date is invalid
 * @param {Date|string|number|null|undefined} date - The date to format
 * @param {string} formatStr - The format string (date-fns format)
 * @param {object} options - Optional date-fns options (e.g., { locale: es })
 * @param {string} fallback - Fallback string if date is invalid (default: '-')
 * @returns {string} Formatted date or fallback
 */
export function safeFormat(date, formatStr, options = {}, fallback = '-') {
    if (!date) return fallback;

    try {
        const dateObj = date instanceof Date ? date : new Date(date);

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            console.warn('[safeFormat] Invalid date:', date);
            return fallback;
        }

        return dateFnsFormat(dateObj, formatStr, options);
    } catch (error) {
        console.error('[safeFormat] Error formatting date:', date, error);
        return fallback;
    }
}

/**
 * Safely create a Date object, returning null if invalid
 * @param {Date|string|number|null|undefined} value - The value to convert to Date
 * @returns {Date|null} Date object or null if invalid
 */
export function safeDate(value) {
    if (!value) return null;
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
}
