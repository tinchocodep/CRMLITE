/**
 * Cuenta Corriente Service
 * Calculates client account balances from real comprobantes
 */

import { getComprobantes } from './comprobantesService';

/**
 * Get all client balances from comprobantes
 * @returns {Array} Array of client account summaries
 */
export const getAllClientBalances = () => {
    try {
        const comprobantes = getComprobantes();

        // Group comprobantes by client
        const clientMap = new Map();

        comprobantes.forEach(comp => {
            const clientName = comp.clientName || 'Cliente Desconocido';

            if (!clientMap.has(clientName)) {
                clientMap.set(clientName, {
                    company: clientName,
                    comprobantes: [],
                    balance: 0,
                    pendingInvoices: 0,
                    overdueInvoices: 0,
                    lastMovement: null,
                    creditLimit: 200000 // Default credit limit
                });
            }

            const client = clientMap.get(clientName);
            client.comprobantes.push(comp);

            // Calculate balance based on type
            const amount = comp.total || 0;

            if (comp.tipo === 'FACTURA') {
                // Invoices increase debt (positive balance = client owes us)
                if (comp.status !== 'paid') {
                    client.balance += amount;
                    client.pendingInvoices++;

                    // Check if overdue (simplified: if more than 30 days old)
                    const emissionDate = new Date(comp.fecha_emision);
                    const daysSince = (Date.now() - emissionDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSince > 30) {
                        client.overdueInvoices++;
                    }
                }
            } else if (comp.tipo === 'NC') {
                // Credit notes reduce debt (negative balance = we owe client)
                client.balance -= amount;
            } else if (comp.tipo === 'COBRO') {
                // Payments reduce debt (client paid us)
                client.balance -= amount;
            }

            // Track last movement
            const compDate = new Date(comp.fecha_emision || comp.createdAt);
            if (!client.lastMovement || compDate > new Date(client.lastMovement)) {
                client.lastMovement = comp.fecha_emision || comp.createdAt;
            }
        });

        // Convert map to array and add IDs
        const accounts = Array.from(clientMap.values()).map((client, index) => ({
            id: `client-${index}`,
            ...client
        }));

        return accounts;
    } catch (error) {
        console.error('Error calculating client balances:', error);
        return [];
    }
};

/**
 * Get balance for a specific client
 * @param {string} clientName - Client name
 * @returns {Object|null} Client account summary
 */
export const getClientBalance = (clientName) => {
    const accounts = getAllClientBalances();
    return accounts.find(acc => acc.company === clientName) || null;
};

/**
 * Get detailed movements for a client
 * @param {string} clientName - Client name
 * @returns {Array} Array of movements with running balance
 */
export const getClientMovements = (clientName) => {
    try {
        const comprobantes = getComprobantes();

        // Filter comprobantes for this client
        const clientComprobantes = comprobantes
            .filter(comp => comp.clientName === clientName)
            .filter(comp => comp.tipo !== 'REMITO') // Only show FACTURA, NC, NOTA_DEBITO, COBRO
            .sort((a, b) => {
                const dateA = new Date(a.fecha_emision || a.createdAt);
                const dateB = new Date(b.fecha_emision || b.createdAt);
                return dateA - dateB;
            });

        // Calculate running balance
        let runningBalance = 0;
        const movements = clientComprobantes.map(comp => {
            const amount = comp.total || 0;

            if (comp.tipo === 'FACTURA' && comp.status !== 'paid') {
                runningBalance += amount;
            } else if (comp.tipo === 'NC') {
                runningBalance -= amount;
            } else if (comp.tipo === 'COBRO') {
                runningBalance -= amount;
            }

            return {
                id: comp.id,
                date: comp.fecha_emision || comp.createdAt,
                type: comp.tipo,
                number: `${comp.tipo}-${comp.letra || ''}-${String(comp.punto_venta || 0).padStart(4, '0')}-${String(comp.numero_cbte || 0).padStart(8, '0')}`,
                amount: amount,
                status: comp.status,
                balance: runningBalance,
                cae: comp.cae,
                // Always provide a pdf_url - use existing or generate a placeholder
                pdf_url: comp.pdf_url || `/api/comprobantes/${comp.id}/pdf`
            };
        });

        return movements;
    } catch (error) {
        console.error('Error getting client movements:', error);
        return [];
    }
};
