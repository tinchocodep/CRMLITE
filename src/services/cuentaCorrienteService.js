/**
 * Cuenta Corriente Service
 * Calculates client account balances from comprobantes stored in Supabase
 */

import { supabase } from '../lib/supabase';

/**
 * Get all client balances from comprobantes in Supabase
 * @returns {Promise<Array>} Array of client account summaries
 */
export const getAllClientBalances = async () => {
    try {
        const { data: comprobantes, error } = await supabase
            .from('comprobantes')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        if (!comprobantes || comprobantes.length === 0) return [];

        // Group comprobantes by client
        const clientMap = new Map();

        comprobantes.forEach(comp => {
            const clientName = comp.client_name || 'Cliente Desconocido';

            if (!clientMap.has(clientName)) {
                clientMap.set(clientName, {
                    company: clientName,
                    comprobantes: [],
                    balance: 0,
                    pendingInvoices: 0,
                    overdueInvoices: 0,
                    lastMovement: null,
                    creditLimit: 200000
                });
            }

            const client = clientMap.get(clientName);
            client.comprobantes.push(comp);

            const amount = comp.total || 0;

            if (comp.tipo === 'FACTURA') {
                if (comp.status !== 'paid') {
                    client.balance += amount;
                    client.pendingInvoices++;

                    const emissionDate = new Date(comp.fecha_emision);
                    const daysSince = (Date.now() - emissionDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSince > 30) {
                        client.overdueInvoices++;
                    }
                }
            } else if (comp.tipo === 'NC') {
                client.balance -= amount;
            } else if (comp.tipo === 'COBRO') {
                client.balance -= amount;
            }

            const compDate = new Date(comp.fecha_emision || comp.created_at);
            if (!client.lastMovement || compDate > new Date(client.lastMovement)) {
                client.lastMovement = comp.fecha_emision || comp.created_at;
            }
        });

        return Array.from(clientMap.values()).map((client, index) => ({
            id: `client-${index}`,
            ...client
        }));
    } catch (error) {
        console.error('Error calculating client balances:', error);
        return [];
    }
};

/**
 * Get balance for a specific client
 * @param {string} clientName - Client name
 * @returns {Promise<Object|null>} Client account summary
 */
export const getClientBalance = async (clientName) => {
    const accounts = await getAllClientBalances();
    return accounts.find(acc => acc.company === clientName) || null;
};

/**
 * Get detailed movements for a client
 * @param {string} clientName - Client name
 * @returns {Promise<Array>} Array of movements with running balance
 */
export const getClientMovements = async (clientName) => {
    try {
        const { data: comprobantes, error } = await supabase
            .from('comprobantes')
            .select('*')
            .eq('client_name', clientName)
            .neq('tipo', 'REMITO') // Only FACTURA, NC, COBRO
            .order('fecha_emision', { ascending: true });

        if (error) throw error;
        if (!comprobantes || comprobantes.length === 0) return [];

        let runningBalance = 0;

        return comprobantes.map(comp => {
            const amount = comp.total || 0;

            if (comp.tipo === 'FACTURA') {
                runningBalance += amount;
            } else if (comp.tipo === 'NC') {
                runningBalance -= amount;
            } else if (comp.tipo === 'COBRO') {
                runningBalance -= amount;
            }

            return {
                id: comp.id,
                date: comp.fecha_emision || comp.created_at,
                type: comp.tipo,
                number: `${comp.tipo}-${comp.letra || ''}-${String(comp.punto_venta || 0).padStart(4, '0')}-${String(comp.numero_cbte || 0).padStart(8, '0')}`,
                amount,
                status: comp.status,
                balance: runningBalance,
                cae: comp.cae,
                pdf_url: comp.pdf_url || null,
                // Payment details
                paymentMethod: comp.payment_method,
                isPartialPayment: comp.is_partial_payment,
                remainingBalance: comp.remaining_balance,
                notes: comp.notes,
            };
        });
    } catch (error) {
        console.error('Error getting client movements:', error);
        return [];
    }
};
