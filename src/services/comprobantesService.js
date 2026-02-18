/**
 * Comprobantes Service
 * Manages invoices (FACTURA), remitos (REMITO), and payment receipts (COBRO)
 * Uses Supabase as the data source (replaces localStorage)
 */

import { supabase } from '../lib/supabase';

// ─── Supabase-based functions (async) ────────────────────────────────────────

/**
 * Get all comprobantes from Supabase for the current tenant
 * @returns {Promise<Array>} Array of comprobantes
 */
export const getComprobantes = async () => {
    try {
        const { data, error } = await supabase
            .from('comprobantes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error loading comprobantes:', error);
        return [];
    }
};

/**
 * Save a new comprobante to Supabase
 * @param {Object} comprobante - Comprobante data
 * @returns {Promise<Object>} Saved comprobante
 */
export const saveComprobante = async (comprobante) => {
    try {
        // Get current user's tenant_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!userData?.tenant_id) throw new Error('No tenant_id found for user');

        const payload = {
            tenant_id: userData.tenant_id,
            order_id: comprobante.orderId || null,
            order_number: comprobante.orderNumber || null,
            tipo: comprobante.tipo,
            letra: comprobante.letra || null,
            punto_venta: comprobante.punto_venta || 0,
            numero_cbte: comprobante.numero_cbte || 0,
            cae: comprobante.cae || null,
            vto_cae: comprobante.vto_cae || null,
            qr_url: comprobante.qr_url || null,
            pdf_url: comprobante.pdf_url || null,
            subtotal: comprobante.subtotal || 0,
            tax: comprobante.tax || 0,
            total: comprobante.total || 0,
            client_name: comprobante.clientName || comprobante.client_name || null,
            fecha_emision: comprobante.fecha_emision || new Date().toISOString().split('T')[0],
            status: comprobante.status || 'pending',
            // Payment-specific
            payment_method: comprobante.paymentMethod || null,
            is_partial_payment: comprobante.isPartialPayment || false,
            remaining_balance: comprobante.remainingBalance || 0,
            notes: comprobante.notes || null,
            // Remito-specific
            products: comprobante.products || null,
            is_partial_remito: comprobante.isPartialRemito || false,
        };

        const { data, error } = await supabase
            .from('comprobantes')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Comprobante saved to Supabase:', data);

        // Return in the format expected by the rest of the app
        return {
            ...data,
            // Map snake_case back to camelCase for compatibility
            orderId: data.order_id,
            orderNumber: data.order_number,
            clientName: data.client_name,
            paymentMethod: data.payment_method,
            isPartialPayment: data.is_partial_payment,
            remainingBalance: data.remaining_balance,
            isPartialRemito: data.is_partial_remito,
        };
    } catch (error) {
        console.error('Error saving comprobante:', error);
        throw error;
    }
};

/**
 * Get comprobantes for a specific order
 * @param {string} orderId - Order ID
 * @returns {Promise<Array>} Array of comprobantes for the order
 */
export const getComprobantesByOrder = async (orderId) => {
    try {
        const { data, error } = await supabase
            .from('comprobantes')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Map to camelCase for compatibility
        return (data || []).map(normalizeComprobante);
    } catch (error) {
        console.error('Error getting comprobantes by order:', error);
        return [];
    }
};

/**
 * Get comprobantes by type
 * @param {string} tipo - "FACTURA", "REMITO", or "COBRO"
 * @returns {Promise<Array>} Array of comprobantes of the specified type
 */
export const getComprobantesByType = async (tipo) => {
    try {
        const { data, error } = await supabase
            .from('comprobantes')
            .select('*')
            .eq('tipo', tipo)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(normalizeComprobante);
    } catch (error) {
        console.error('Error getting comprobantes by type:', error);
        return [];
    }
};

/**
 * Delete a comprobante
 * @param {string} id - Comprobante ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteComprobante = async (id) => {
    try {
        const { error } = await supabase
            .from('comprobantes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting comprobante:', error);
        return false;
    }
};

/**
 * Get shipped quantities for each product in an order
 * Calculates total quantities shipped across all remitos
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Map of productId -> total quantity shipped
 */
export const getShippedQuantitiesAsync = async (orderId) => {
    const remitos = await getComprobantesByOrder(orderId);
    const remitosList = remitos.filter(c => c.tipo === 'REMITO');

    const shippedByProduct = {};

    remitosList.forEach(remito => {
        if (remito.products && Array.isArray(remito.products)) {
            remito.products.forEach(p => {
                shippedByProduct[p.productId] =
                    (shippedByProduct[p.productId] || 0) + (p.quantityShipped || 0);
            });
        }
    });

    return shippedByProduct;
};

// ─── Sync fallback (for components that haven't migrated to async yet) ────────
// These read from localStorage as a temporary bridge while migrating

const COMPROBANTES_STORAGE_KEY = 'crm_comprobantes';

/**
 * @deprecated Use getComprobantes() (async) instead
 * Sync version for backward compatibility
 */
export const getComprobantesSync = () => {
    try {
        const stored = localStorage.getItem(COMPROBANTES_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading comprobantes from localStorage:', error);
        return [];
    }
};

/**
 * @deprecated Use getComprobantesByOrder() (async) instead
 * Sync version for backward compatibility - used by InvoiceActionModal
 */
export const getShippedQuantities = (orderId) => {
    const comprobantes = getComprobantesSync();
    const remitos = comprobantes.filter(c => c.orderId === orderId && c.tipo === 'REMITO');

    const shippedByProduct = {};
    remitos.forEach(remito => {
        if (remito.products && Array.isArray(remito.products)) {
            remito.products.forEach(p => {
                shippedByProduct[p.productId] =
                    (shippedByProduct[p.productId] || 0) + (p.quantityShipped || 0);
            });
        }
    });

    return shippedByProduct;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize a comprobante from Supabase (snake_case) to app format (camelCase)
 */
const normalizeComprobante = (comp) => ({
    ...comp,
    orderId: comp.order_id,
    orderNumber: comp.order_number,
    clientName: comp.client_name,
    paymentMethod: comp.payment_method,
    isPartialPayment: comp.is_partial_payment,
    remainingBalance: comp.remaining_balance,
    isPartialRemito: comp.is_partial_remito,
});
