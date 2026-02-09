/**
 * Comprobantes Service
 * Manages invoices, remitos, and payment receipts
 */

// Local storage key
const COMPROBANTES_STORAGE_KEY = 'crm_comprobantes';

/**
 * Get all comprobantes from local storage
 * @returns {Array} Array of comprobantes
 */
export const getComprobantes = () => {
    try {
        const stored = localStorage.getItem(COMPROBANTES_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading comprobantes:', error);
        return [];
    }
};

/**
 * Save a new comprobante
 * @param {Object} comprobante - Comprobante data
 * @param {string} comprobante.tipo - "FACTURA", "REMITO", or "COBRO"
 * @param {string} comprobante.orderId - Associated order ID
 * @param {string} comprobante.orderNumber - Associated order number
 * @param {number} comprobante.punto_venta - Point of sale number
 * @param {number} comprobante.numero_cbte - Invoice/Remito number
 * @param {string} comprobante.letra - Letter (A, B, C)
 * @param {string} comprobante.cae - CAE from AFIP
 * @param {string} comprobante.vto_cae - CAE expiration date
 * @param {string} comprobante.qr_url - QR code URL
 * @param {string} comprobante.pdf_url - PDF URL
 * @param {number} comprobante.total - Total amount
 * @param {string} comprobante.clientName - Client name
 * @param {string} comprobante.fecha_emision - Emission date
 * @returns {Object} Saved comprobante with ID
 */
export const saveComprobante = (comprobante) => {
    try {
        const comprobantes = getComprobantes();

        const newComprobante = {
            id: `comp-${Date.now()}`,
            ...comprobante,
            createdAt: new Date().toISOString()
        };

        comprobantes.push(newComprobante);
        localStorage.setItem(COMPROBANTES_STORAGE_KEY, JSON.stringify(comprobantes));

        console.log('✅ Comprobante saved:', newComprobante);
        return newComprobante;
    } catch (error) {
        console.error('Error saving comprobante:', error);
        throw error;
    }
};

/**
 * Get comprobantes for a specific order
 * @param {string} orderId - Order ID
 * @returns {Array} Array of comprobantes for the order
 */
export const getComprobantesByOrder = (orderId) => {
    const comprobantes = getComprobantes();
    return comprobantes.filter(c => c.orderId === orderId);
};

/**
 * Get comprobantes by type
 * @param {string} tipo - "FACTURA", "REMITO", or "COBRO"
 * @returns {Array} Array of comprobantes of the specified type
 */
export const getComprobantesByType = (tipo) => {
    const comprobantes = getComprobantes();
    return comprobantes.filter(c => c.tipo === tipo);
};

/**
 * Delete a comprobante
 * @param {string} id - Comprobante ID
 * @returns {boolean} Success status
 */
export const deleteComprobante = (id) => {
    try {
        const comprobantes = getComprobantes();
        const filtered = comprobantes.filter(c => c.id !== id);
        localStorage.setItem(COMPROBANTES_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting comprobante:', error);
        return false;
    }
};
