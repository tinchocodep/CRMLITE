import { Invoice, Payment, PaymentAllocation, AccountMovement } from '../types/cotizador';
import { orders } from './orders';

// Facturas generadas desde pedidos
export const invoices: Invoice[] = [
    // Factura 1 - Del pedido 1 (Completado)
    {
        id: 'inv-001',
        orderId: orders[0].id,
        clientId: orders[0].clientId,
        clientName: orders[0].clientName,
        invoiceType: 'A',
        isAfip: true,
        pointOfSale: '0001',
        invoiceNumber: '00000123',
        cae: '72081234567890',
        caeExpiry: '2026-02-20',
        issueDate: '2026-02-10',
        paymentCondition: orders[0].paymentCondition,
        lines: orders[0].lines.map(line => ({
            id: line.id,
            productName: line.productName,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            subtotal: line.subtotal,
            taxRate: line.taxRate,
            total: line.total
        })),
        subtotal: orders[0].subtotal,
        tax: orders[0].tax,
        total: orders[0].total,
        createdAt: '2026-02-10T14:20:00Z'
    },

    // Factura 2 - Del pedido 2 (Facturado)
    {
        id: 'inv-002',
        orderId: orders[1].id,
        clientId: orders[1].clientId,
        clientName: orders[1].clientName,
        invoiceType: 'A',
        isAfip: true,
        pointOfSale: '0001',
        invoiceNumber: '00000124',
        cae: '72081234567891',
        caeExpiry: '2026-02-16',
        issueDate: '2026-02-06',
        paymentCondition: orders[1].paymentCondition,
        lines: orders[1].lines.map(line => ({
            id: line.id,
            productName: line.productName,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            subtotal: line.subtotal,
            taxRate: line.taxRate,
            total: line.total
        })),
        subtotal: orders[1].subtotal,
        tax: orders[1].tax,
        total: orders[1].total,
        createdAt: '2026-02-06T16:30:00Z'
    },

    // Factura 3 - Del pedido 5 (Pagado) - Proforma (Partner)
    {
        id: 'inv-003',
        orderId: orders[4].id,
        clientId: orders[4].clientId,
        clientName: orders[4].clientName,
        invoiceType: 'B',
        isAfip: false, // Proforma
        partnerInvoiceRef: 'ADV-FC-2026-0089',
        pointOfSale: '0002',
        invoiceNumber: 'PROF-00001',
        issueDate: '2026-02-02',
        paymentCondition: orders[4].paymentCondition,
        lines: orders[4].lines.map(line => ({
            id: line.id,
            productName: line.productName,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            subtotal: line.subtotal,
            taxRate: line.taxRate,
            total: line.total
        })),
        subtotal: orders[4].subtotal,
        tax: orders[4].tax,
        total: orders[4].total,
        createdAt: '2026-02-02T15:45:00Z'
    }
];

// Pagos recibidos
export const payments: Payment[] = [
    // Pago 1 - Transferencia para Factura 1
    {
        id: 'pay-001',
        clientId: orders[0].clientId,
        clientName: orders[0].clientName,
        paymentMethod: 'transfer',
        amount: orders[0].total,
        paymentDate: '2026-02-15',
        receiptNumber: 'REC-2026-001',
        bankName: 'Banco Nación',
        transferOperation: '20260215-123456',
        cbuCvuOrigin: '0110599520000001234567',
        payerName: orders[0].clientName,
        createdAt: '2026-02-15T11:45:00Z'
    },

    // Pago 2 - Efectivo para Factura 3
    {
        id: 'pay-002',
        clientId: orders[4].clientId,
        clientName: orders[4].clientName,
        paymentMethod: 'cash',
        amount: orders[4].total,
        paymentDate: '2026-02-03',
        receiptNumber: 'REC-2026-002',
        createdAt: '2026-02-03T10:00:00Z'
    },

    // Pago 3 - Cheque diferido (pago parcial para otra factura)
    {
        id: 'pay-003',
        clientId: orders[1].clientId,
        clientName: orders[1].clientName,
        paymentMethod: 'check',
        amount: 50000,
        paymentDate: '2026-02-08',
        receiptNumber: 'REC-2026-003',
        bankName: 'Banco Galicia',
        checkNumber: '45678901',
        checkDueDate: '2026-03-08',
        payerName: orders[1].clientName,
        createdAt: '2026-02-08T14:30:00Z'
    }
];

// Asignaciones de pagos a facturas
export const paymentAllocations: PaymentAllocation[] = [
    {
        id: 'alloc-001',
        paymentId: payments[0].id,
        invoiceId: invoices[0].id,
        invoiceNumber: `${invoices[0].pointOfSale}-${invoices[0].invoiceNumber}`,
        allocatedAmount: payments[0].amount
    },
    {
        id: 'alloc-002',
        paymentId: payments[1].id,
        invoiceId: invoices[2].id,
        invoiceNumber: `${invoices[2].pointOfSale}-${invoices[2].invoiceNumber}`,
        allocatedAmount: payments[1].amount
    },
    {
        id: 'alloc-003',
        paymentId: payments[2].id,
        invoiceId: invoices[1].id,
        invoiceNumber: `${invoices[1].pointOfSale}-${invoices[1].invoiceNumber}`,
        allocatedAmount: payments[2].amount
    }
];

// Movimientos de Cuenta Corriente (generados automáticamente)
export const accountMovements: AccountMovement[] = [
    // Cliente 1 (AGRO BC S.R.L.)
    {
        id: 'mov-001',
        clientId: orders[0].clientId,
        date: '2026-02-10',
        type: 'invoice',
        documentType: 'Factura A',
        documentNumber: '0001-00000123',
        debit: orders[0].total,
        credit: 0,
        balance: orders[0].total,
        relatedDocumentId: invoices[0].id,
        description: 'Factura por venta de semillas'
    },
    {
        id: 'mov-002',
        clientId: orders[0].clientId,
        date: '2026-02-15',
        type: 'payment',
        documentType: 'Recibo',
        documentNumber: 'REC-2026-001',
        debit: 0,
        credit: payments[0].amount,
        balance: 0,
        relatedDocumentId: payments[0].id,
        description: 'Pago por transferencia'
    },

    // Cliente 2 (AGROCAN S.A.)
    {
        id: 'mov-003',
        clientId: orders[1].clientId,
        date: '2026-02-06',
        type: 'invoice',
        documentType: 'Factura A',
        documentNumber: '0001-00000124',
        debit: orders[1].total,
        credit: 0,
        balance: orders[1].total,
        relatedDocumentId: invoices[1].id,
        description: 'Factura por venta de semillas'
    },
    {
        id: 'mov-004',
        clientId: orders[1].clientId,
        date: '2026-02-08',
        type: 'payment',
        documentType: 'Recibo',
        documentNumber: 'REC-2026-003',
        debit: 0,
        credit: payments[2].amount,
        balance: orders[1].total - payments[2].amount,
        relatedDocumentId: payments[2].id,
        description: 'Pago parcial con cheque diferido'
    },

    // Cliente 3 (CAPITANICH AGROPECUARIA SA)
    {
        id: 'mov-005',
        clientId: orders[4].clientId,
        date: '2026-02-02',
        type: 'invoice',
        documentType: 'Proforma',
        documentNumber: '0002-PROF-00001',
        debit: orders[4].total,
        credit: 0,
        balance: orders[4].total,
        relatedDocumentId: invoices[2].id,
        description: 'Proforma - Venta Partner'
    },
    {
        id: 'mov-006',
        clientId: orders[4].clientId,
        date: '2026-02-03',
        type: 'payment',
        documentType: 'Recibo',
        documentNumber: 'REC-2026-002',
        debit: 0,
        credit: payments[1].amount,
        balance: 0,
        relatedDocumentId: payments[1].id,
        description: 'Pago en efectivo'
    }
];
