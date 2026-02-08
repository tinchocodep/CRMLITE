import { Quotation, QuotationLine } from '../types/cotizador';
import { clients } from './clients';
import { products } from './products';

// Generar líneas de cotización de ejemplo
const generateQuotationLines = (count: number): QuotationLine[] => {
    const lines: QuotationLine[] = [];
    const selectedProducts = products.slice(0, count);

    selectedProducts.forEach((product, index) => {
        const quantity = Math.floor(Math.random() * 50) + 10;
        const volume = quantity * 0.02; // Aproximado
        const unitPrice = product.precio;
        const subtotal = quantity * unitPrice;
        const taxRate = 21;
        const total = subtotal * (1 + taxRate / 100);

        lines.push({
            id: `line-${index + 1}`,
            productSapCode: product.sapCode,
            productName: product.hybridNameAtSkuLevel,
            quantity,
            volume,
            unitPrice,
            subtotal,
            taxRate,
            total
        });
    });

    return lines;
};

// Calcular totales
const calculateTotals = (lines: QuotationLine[]) => {
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const tax = lines.reduce((sum, line) => sum + (line.subtotal * line.taxRate / 100), 0);
    const total = subtotal + tax;
    return { subtotal, tax, total };
};

export const quotations: Quotation[] = [
    // Cotización 1 - Aprobada
    {
        id: 'quot-001',
        number: 'COT-2026-001',
        clientId: String(clients[0].cuenta),
        clientName: clients[0].razonSocial,
        saleType: 'own',
        paymentCondition: '30d',
        deliveryDate: '2026-03-15',
        originAddress: 'Depósito Central - Av. Libertador 1500, CABA',
        destinationAddress: 'Campo La Esperanza - Ruta 34 Km 850, Chaco',
        status: 'approved',
        lines: generateQuotationLines(3),
        ...calculateTotals(generateQuotationLines(3)),
        createdAt: '2026-02-01T10:30:00Z',
        updatedAt: '2026-02-05T14:20:00Z'
    },

    // Cotización 2 - Enviada
    {
        id: 'quot-002',
        number: 'COT-2026-002',
        clientId: String(clients[1].cuenta),
        clientName: clients[1].razonSocial,
        saleType: 'partner',
        paymentCondition: '60d',
        deliveryDate: '2026-03-20',
        originAddress: 'Depósito Norte - Ruta 11 Km 1200, Santa Fe',
        destinationAddress: 'Establecimiento San Jorge - Ruta 95 Km 45, Formosa',
        status: 'sent',
        lines: generateQuotationLines(4),
        ...calculateTotals(generateQuotationLines(4)),
        createdAt: '2026-02-03T09:15:00Z',
        updatedAt: '2026-02-03T09:15:00Z'
    },

    // Cotización 3 - Borrador
    {
        id: 'quot-003',
        number: 'COT-2026-003',
        clientId: String(clients[2].cuenta),
        clientName: clients[2].razonSocial,
        saleType: 'own',
        paymentCondition: 'cash',
        deliveryDate: '2026-03-10',
        originAddress: 'Depósito Central - Av. Libertador 1500, CABA',
        destinationAddress: 'Campo El Progreso - Ruta 16 Km 320, Salta',
        status: 'draft',
        lines: generateQuotationLines(2),
        ...calculateTotals(generateQuotationLines(2)),
        createdAt: '2026-02-07T16:45:00Z',
        updatedAt: '2026-02-07T16:45:00Z'
    },

    // Cotización 4 - Aprobada
    {
        id: 'quot-004',
        number: 'COT-2026-004',
        clientId: String(clients[3].cuenta),
        clientName: clients[3].razonSocial,
        saleType: 'own',
        paymentCondition: '30d',
        deliveryDate: '2026-03-25',
        originAddress: 'Depósito Sur - Av. Circunvalación 2300, Córdoba',
        destinationAddress: 'Estancia Los Alamos - Ruta 9 Km 650, Santiago del Estero',
        status: 'approved',
        lines: generateQuotationLines(5),
        ...calculateTotals(generateQuotationLines(5)),
        createdAt: '2026-01-28T11:20:00Z',
        updatedAt: '2026-02-02T10:30:00Z'
    },

    // Cotización 5 - En Revisión
    {
        id: 'quot-005',
        number: 'COT-2026-005',
        clientId: String(clients[4].cuenta),
        clientName: clients[4].razonSocial,
        saleType: 'partner',
        paymentCondition: '90d',
        deliveryDate: '2026-04-05',
        originAddress: 'Depósito Oeste - Parque Industrial, Mendoza',
        destinationAddress: 'Campo Santa Rosa - Ruta 40 Km 1200, La Pampa',
        status: 'revision',
        lines: generateQuotationLines(3),
        ...calculateTotals(generateQuotationLines(3)),
        createdAt: '2026-02-06T14:00:00Z',
        updatedAt: '2026-02-08T09:30:00Z'
    },

    // Cotización 6 - Rechazada
    {
        id: 'quot-006',
        number: 'COT-2026-006',
        clientId: String(clients[5].cuenta),
        clientName: clients[5].razonSocial,
        saleType: 'own',
        paymentCondition: '60d',
        deliveryDate: '2026-03-18',
        originAddress: 'Depósito Central - Av. Libertador 1500, CABA',
        destinationAddress: 'Campo El Mirador - Ruta 81 Km 450, Chaco',
        status: 'rejected',
        lines: generateQuotationLines(2),
        ...calculateTotals(generateQuotationLines(2)),
        createdAt: '2026-01-25T10:00:00Z',
        updatedAt: '2026-01-30T15:45:00Z'
    },

    // Cotización 7 - Aprobada
    {
        id: 'quot-007',
        number: 'COT-2026-007',
        clientId: String(clients[6].cuenta),
        clientName: clients[6].razonSocial,
        saleType: 'own',
        paymentCondition: '30d',
        deliveryDate: '2026-03-22',
        originAddress: 'Depósito Norte - Ruta 11 Km 1200, Santa Fe',
        destinationAddress: 'Establecimiento La Fortuna - Ruta 34 Km 920, Chaco',
        status: 'approved',
        lines: generateQuotationLines(4),
        ...calculateTotals(generateQuotationLines(4)),
        createdAt: '2026-02-04T13:30:00Z',
        updatedAt: '2026-02-06T11:15:00Z'
    },

    // Cotización 8 - Enviada
    {
        id: 'quot-008',
        number: 'COT-2026-008',
        clientId: String(clients[7].cuenta),
        clientName: clients[7].razonSocial,
        saleType: 'partner',
        paymentCondition: 'cash',
        deliveryDate: '2026-03-12',
        originAddress: 'Depósito Sur - Av. Circunvalación 2300, Córdoba',
        destinationAddress: 'Campo Los Pinos - Ruta 38 Km 780, Catamarca',
        status: 'sent',
        lines: generateQuotationLines(3),
        ...calculateTotals(generateQuotationLines(3)),
        createdAt: '2026-02-08T08:00:00Z',
        updatedAt: '2026-02-08T08:00:00Z'
    }
];
