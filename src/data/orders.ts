import { Order } from '../types/cotizador';
import { quotations } from './quotations';

// Convertir cotizaciones aprobadas en pedidos
export const orders: Order[] = [
    // Pedido 1 - De cotización 001 - Completado
    {
        id: 'ord-001',
        orderNumber: 'PED-2026-001',
        quotationId: quotations[0].id,
        clientId: quotations[0].clientId,
        clientName: quotations[0].clientName,
        clientCuit: '30716831325', // AGRO BC S.R.L.
        saleType: quotations[0].saleType,
        paymentCondition: quotations[0].paymentCondition,
        deliveryDate: quotations[0].deliveryDate,
        originAddress: quotations[0].originAddress,
        destinationAddress: quotations[0].destinationAddress,
        status: 'completed',
        lines: quotations[0].lines,
        subtotal: quotations[0].subtotal,
        tax: quotations[0].tax,
        total: quotations[0].total,
        createdAt: '2026-02-05T15:00:00Z',
        shippedAt: '2026-02-10T09:30:00Z',
        invoicedAt: '2026-02-10T14:20:00Z',
        paidAt: '2026-02-15T11:45:00Z'
    },

    // Pedido 2 - De cotización 004 - Facturado
    {
        id: 'ord-002',
        orderNumber: 'PED-2026-002',
        quotationId: quotations[3].id,
        clientId: quotations[3].clientId,
        clientName: quotations[3].clientName,
        clientCuit: '30718867173', // AGRO GANADERA GUAPAS S.R.L.
        saleType: quotations[3].saleType,
        paymentCondition: quotations[3].paymentCondition,
        deliveryDate: quotations[3].deliveryDate,
        originAddress: quotations[3].originAddress,
        destinationAddress: quotations[3].destinationAddress,
        status: 'invoiced',
        lines: quotations[3].lines,
        subtotal: quotations[3].subtotal,
        tax: quotations[3].tax,
        total: quotations[3].total,
        createdAt: '2026-02-02T11:00:00Z',
        shippedAt: '2026-02-06T10:15:00Z',
        invoicedAt: '2026-02-06T16:30:00Z'
    },

    // Pedido 3 - De cotización 007 - Remitido
    {
        id: 'ord-003',
        orderNumber: 'PED-2026-003',
        quotationId: quotations[6].id,
        clientId: quotations[6].clientId,
        clientName: quotations[6].clientName,
        clientCuit: '30716370948', // AGRO-MAN S.A.S.
        saleType: quotations[6].saleType,
        paymentCondition: quotations[6].paymentCondition,
        deliveryDate: quotations[6].deliveryDate,
        originAddress: quotations[6].originAddress,
        destinationAddress: quotations[6].destinationAddress,
        status: 'shipped',
        lines: quotations[6].lines,
        subtotal: quotations[6].subtotal,
        tax: quotations[6].tax,
        total: quotations[6].total,
        createdAt: '2026-02-06T12:00:00Z',
        shippedAt: '2026-02-08T08:45:00Z'
    },

    // Pedido 4 - Pendiente
    {
        id: 'ord-004',
        orderNumber: 'PED-2026-004',
        quotationId: 'quot-009', // Nueva cotización no listada
        clientId: String(4770), // BIO ZELEN SA
        clientName: 'BIO ZELEN SA',
        clientCuit: '33716799099',
        saleType: 'own',
        paymentCondition: '60d',
        deliveryDate: '2026-03-28',
        originAddress: 'Depósito Central - Av. Libertador 1500, CABA',
        destinationAddress: 'Campo Verde - Ruta 89 Km 230, Formosa',
        status: 'pending',
        lines: [
            {
                id: 'line-1',
                productSapCode: 198000053,
                productName: '80-63TRE Band 3',
                quantity: 40,
                volume: 0.8,
                unitPrice: 1550,
                subtotal: 62000,
                taxRate: 21,
                total: 75020
            },
            {
                id: 'line-2',
                productSapCode: 189001354,
                productName: 'MAIZ HIBRIDO 80-63TRE C4 (C3L) PS',
                quantity: 30,
                volume: 0.6,
                unitPrice: 1550,
                subtotal: 46500,
                taxRate: 21,
                total: 56265
            }
        ],
        subtotal: 108500,
        tax: 22785,
        total: 131285,
        createdAt: '2026-02-08T10:30:00Z'
    },

    // Pedido 5 - Pagado
    {
        id: 'ord-005',
        orderNumber: 'PED-2026-005',
        quotationId: 'quot-010',
        clientId: String(4771), // CAPITANICH AGROPECUARIA SA
        clientName: 'CAPITANICH AGROPECUARIA SA',
        clientCuit: '30716775395',
        saleType: 'advanta',
        paymentCondition: 'cash',
        deliveryDate: '2026-03-08',
        originAddress: 'Depósito Norte - Ruta 11 Km 1200, Santa Fe',
        destinationAddress: 'Estancia El Dorado - Ruta 16 Km 580, Chaco',
        status: 'paid',
        lines: [
            {
                id: 'line-1',
                productSapCode: 162050086,
                productName: 'HYBRID FORAGE SORGO ADV2650 IG PS',
                quantity: 25,
                volume: 0.5,
                unitPrice: 1350,
                subtotal: 33750,
                taxRate: 21,
                total: 40837.5
            }
        ],
        subtotal: 33750,
        tax: 7087.5,
        total: 40837.5,
        createdAt: '2026-01-30T09:00:00Z',
        shippedAt: '2026-02-02T11:20:00Z',
        invoicedAt: '2026-02-02T15:45:00Z',
        paidAt: '2026-02-03T10:00:00Z'
    },

    // Pedido 6 - Pendiente (para probar facturación)
    {
        id: 'ord-006',
        orderNumber: 'PED-2026-006',
        quotationId: 'quot-011',
        clientId: String(4772),
        clientName: 'AGROCAN S.A.',
        clientCuit: '30716831326',
        saleType: 'own',
        paymentCondition: '30d',
        deliveryDate: '2026-03-15',
        originAddress: 'Depósito Central - Av. Libertador 1500, CABA',
        destinationAddress: 'Campo Norte - Ruta 34 Km 450, Salta',
        status: 'pending',
        lines: [
            {
                id: 'line-1',
                productSapCode: 198000053,
                productName: '80-63TRE Band 3',
                quantity: 50,
                volume: 1.0,
                unitPrice: 5354.25,
                subtotal: 267712.5,
                taxRate: 21,
                total: 323932.125
            }
        ],
        subtotal: 267712.5,
        tax: 56219.625,
        total: 323932.125,
        createdAt: '2026-02-08T14:00:00Z'
    },

    // Pedido 7 - Facturado (para probar cobros parciales)
    {
        id: 'ord-007',
        orderNumber: 'PED-2026-007',
        quotationId: 'quot-012',
        clientId: String(4773),
        clientName: 'CAMPO VERDE S.R.L.',
        clientCuit: '30716831327',
        saleType: 'advanta',
        paymentCondition: '60d',
        deliveryDate: '2026-03-20',
        originAddress: 'Depósito Norte - Ruta 11 Km 1200, Santa Fe',
        destinationAddress: 'Establecimiento La Esperanza - Ruta 9 Km 890, Córdoba',
        status: 'invoiced',
        lines: [
            {
                id: 'line-1',
                productSapCode: 189001354,
                productName: 'MAIZ HIBRIDO 80-63TRE C4 (C3L) PS',
                quantity: 100,
                volume: 2.0,
                unitPrice: 1550,
                subtotal: 155000,
                taxRate: 21,
                total: 187550
            }
        ],
        subtotal: 155000,
        tax: 32550,
        total: 187550,
        createdAt: '2026-02-07T10:00:00Z',
        shippedAt: '2026-02-09T08:30:00Z',
        invoicedAt: '2026-02-09T12:00:00Z'
    },

    // Pedido 8 - Remitido (para probar facturación después de remito)
    {
        id: 'ord-008',
        orderNumber: 'PED-2026-008',
        quotationId: 'quot-013',
        clientId: String(4774),
        clientName: 'ESTANCIA DON PEDRO S.A.',
        clientCuit: '30716831328',
        saleType: 'own',
        paymentCondition: '90d',
        deliveryDate: '2026-03-10',
        originAddress: 'Depósito Sur - Ruta 3 Km 780, Buenos Aires',
        destinationAddress: 'Campo La Pampa - Ruta 35 Km 320, La Pampa',
        status: 'shipped',
        lines: [
            {
                id: 'line-1',
                productSapCode: 162050086,
                productName: 'HYBRID FORAGE SORGO ADV2650 IG PS',
                quantity: 75,
                volume: 1.5,
                unitPrice: 1350,
                subtotal: 101250,
                taxRate: 21,
                total: 122512.5
            }
        ],
        subtotal: 101250,
        tax: 21262.5,
        total: 122512.5,
        createdAt: '2026-02-06T09:00:00Z',
        shippedAt: '2026-02-08T14:30:00Z'
    },

    // Pedido 9 - Pendiente (monto pequeño para probar cobro total)
    {
        id: 'ord-009',
        orderNumber: 'PED-2026-009',
        quotationId: 'quot-014',
        clientId: String(4775),
        clientName: 'AGRO SUR S.A.',
        clientCuit: '30716831329',
        saleType: 'advanta',
        paymentCondition: 'cash',
        deliveryDate: '2026-03-05',
        originAddress: 'Depósito Central - Av. Libertador 1500, CABA',
        destinationAddress: 'Campo El Progreso - Ruta 7 Km 560, Buenos Aires',
        status: 'pending',
        lines: [
            {
                id: 'line-1',
                productSapCode: 198000053,
                productName: '80-63TRE Band 3',
                quantity: 10,
                volume: 0.2,
                unitPrice: 1550,
                subtotal: 15500,
                taxRate: 21,
                total: 18755
            }
        ],
        subtotal: 15500,
        tax: 3255,
        total: 18755,
        createdAt: '2026-02-09T11:00:00Z'
    },

    // Pedido 10 - Facturado (monto grande para probar múltiples cobros parciales)
    {
        id: 'ord-010',
        orderNumber: 'PED-2026-010',
        quotationId: 'quot-015',
        clientId: String(4776),
        clientName: 'MEGA AGRO S.A.',
        clientCuit: '30716831330',
        saleType: 'own',
        paymentCondition: '90d',
        deliveryDate: '2026-04-01',
        originAddress: 'Depósito Norte - Ruta 11 Km 1200, Santa Fe',
        destinationAddress: 'Establecimiento Los Alamos - Ruta 33 Km 1200, Santa Fe',
        status: 'invoiced',
        lines: [
            {
                id: 'line-1',
                productSapCode: 189001354,
                productName: 'MAIZ HIBRIDO 80-63TRE C4 (C3L) PS',
                quantity: 200,
                volume: 4.0,
                unitPrice: 1550,
                subtotal: 310000,
                taxRate: 21,
                total: 375100
            },
            {
                id: 'line-2',
                productSapCode: 162050086,
                productName: 'HYBRID FORAGE SORGO ADV2650 IG PS',
                quantity: 150,
                volume: 3.0,
                unitPrice: 1350,
                subtotal: 202500,
                taxRate: 21,
                total: 245025
            }
        ],
        subtotal: 512500,
        tax: 107625,
        total: 620125,
        createdAt: '2026-02-05T08:00:00Z',
        shippedAt: '2026-02-07T10:00:00Z',
        invoicedAt: '2026-02-07T16:00:00Z'
    }
];
