/**
 * Cuenta Corriente Service
 * Calculates client account balances from comprobantes stored in Supabase
 * Reads credit_limit from the companies table
 */

import { supabase } from '../lib/supabase';

/**
 * Get all client balances from comprobantes in Supabase
 * Joins with companies to get the real credit_limit per client
 * @returns {Promise<Array>} Array of client account summaries
 */
export const getAllClientBalances = async () => {
    try {
        // Fetch comprobantes joined with orders → companies to get credit_limit
        const { data: comprobantes, error } = await supabase
            .from('comprobantes')
            .select(`
                *,
                order:orders!order_id(
                    company_id,
                    company:companies!company_id(id, trade_name, legal_name, credit_limit)
                )
            `)
            .order('created_at', { ascending: true });

        if (error) throw error;
        if (!comprobantes || comprobantes.length === 0) return [];

        // Group comprobantes by client
        const clientMap = new Map();

        comprobantes.forEach(comp => {
            const clientName = comp.client_name || 'Cliente Desconocido';
            const company = comp.order?.company;
            const creditLimit = company?.credit_limit ?? 200000;
            const companyId = company?.id ?? null;

            if (!clientMap.has(clientName)) {
                clientMap.set(clientName, {
                    company: clientName,
                    companyId,
                    comprobantes: [],
                    balance: 0,
                    pendingInvoices: 0,
                    overdueInvoices: 0,
                    lastMovement: null,
                    creditLimit
                });
            }

            const client = clientMap.get(clientName);
            client.comprobantes.push(comp);

            // Update creditLimit if we now have a real value from the company
            if (creditLimit !== 200000 || client.creditLimit === 200000) {
                client.creditLimit = creditLimit;
            }
            if (companyId && !client.companyId) {
                client.companyId = companyId;
            }

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
 * Update the credit limit for a company
 * @param {number} companyId - Company ID
 * @param {number} creditLimit - New credit limit
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateCreditLimit = async (companyId, creditLimit) => {
    try {
        const { error } = await supabase
            .from('companies')
            .update({ credit_limit: creditLimit })
            .eq('id', companyId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error updating credit limit:', error);
        return { success: false, error: error.message };
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
