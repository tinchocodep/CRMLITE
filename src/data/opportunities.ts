import { clients } from './clients';
import { products } from './products';

export interface OpportunityProduct {
    sapCode: number;
    productName: string;
    quantity: number;
    estimatedPrice: number;
}

export interface Opportunity {
    id: string;
    clientId: string;
    clientName: string;
    title: string;
    description: string;
    saleType: 'own' | 'partner';
    products: OpportunityProduct[];
    estimatedValue: number;
    probability: number;
    expectedCloseDate: string;
    status: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';
    createdAt: string;
    updatedAt: string;
}

export const opportunities: Opportunity[] = [
    {
        id: 'opp-001',
        clientId: String(clients[0].cuenta),
        clientName: clients[0].razonSocial,
        title: 'Venta de Semillas de Maíz - Campaña 2026',
        description: 'Cliente interesado en adquirir semillas de maíz híbrido para la próxima campaña. Requiere entrega en marzo.',
        saleType: 'own',
        products: [
            {
                sapCode: 198000053,
                productName: '80-63TRE Band 3',
                quantity: 40,
                estimatedPrice: 1550
            },
            {
                sapCode: 189001354,
                productName: 'MAIZ HIBRIDO 80-63TRE C4 (C3L) PS',
                quantity: 30,
                estimatedPrice: 1550
            }
        ],
        estimatedValue: 108500,
        probability: 75,
        expectedCloseDate: '2026-02-28',
        status: 'negotiation',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-02-05T14:30:00Z'
    },
    {
        id: 'opp-002',
        clientId: String(clients[2].cuenta),
        clientName: clients[2].razonSocial,
        title: 'Provisión de Sorgo Forrajero',
        description: 'Oportunidad para venta de sorgo forrajero. Cliente busca proveedor confiable para stock consignado.',
        saleType: 'partner',
        products: [
            {
                sapCode: 162050086,
                productName: 'HYBRID FORAGE SORGO ADV2650 IG PS',
                quantity: 50,
                estimatedPrice: 1350
            }
        ],
        estimatedValue: 67500,
        probability: 60,
        expectedCloseDate: '2026-03-10',
        status: 'proposal',
        createdAt: '2026-01-20T11:30:00Z',
        updatedAt: '2026-02-01T09:15:00Z'
    },
    {
        id: 'opp-003',
        clientId: String(clients[5].cuenta),
        clientName: clients[5].razonSocial,
        title: 'Semillas de Girasol Alto Oleico',
        description: 'Cliente requiere semillas de girasol para 200 hectáreas. Interesado en variedades CL HO.',
        saleType: 'own',
        products: [
            {
                sapCode: 165030229,
                productName: 'HYBRID SF ADV5205 CLHO G1 180K PS',
                quantity: 35,
                estimatedPrice: 1450
            },
            {
                sapCode: 167030229,
                productName: 'HYBRID SF ADV5205 CLHO G2 180K PS',
                quantity: 25,
                estimatedPrice: 1450
            }
        ],
        estimatedValue: 87000,
        probability: 80,
        expectedCloseDate: '2026-02-25',
        status: 'negotiation',
        createdAt: '2026-01-25T14:00:00Z',
        updatedAt: '2026-02-07T16:20:00Z'
    },
    {
        id: 'opp-004',
        clientId: String(clients[8].cuenta),
        clientName: clients[8].razonSocial,
        title: 'Canola para Siembra Temprana',
        description: 'Oportunidad de venta de semillas de canola. Cliente planifica siembra temprana.',
        saleType: 'own',
        products: [
            {
                sapCode: 166040120,
                productName: 'CONTINUUM CL Standard 20kg',
                quantity: 20,
                estimatedPrice: 1250
            },
            {
                sapCode: 162040067,
                productName: 'Hybrid C Hyola 433 PS',
                quantity: 15,
                estimatedPrice: 1250
            }
        ],
        estimatedValue: 43750,
        probability: 50,
        expectedCloseDate: '2026-03-05',
        status: 'qualification',
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-06T11:00:00Z'
    },
    {
        id: 'opp-005',
        clientId: String(clients[10].cuenta),
        clientName: clients[10].razonSocial,
        title: 'Químicos para Control de Malezas',
        description: 'Cliente necesita herbicidas para aplicación pre-siembra. Volumen importante.',
        saleType: 'own',
        products: [
            {
                sapCode: 189990009,
                productName: 'CLEARSOL DF 2PZ x 0.6 Kg',
                quantity: 30,
                estimatedPrice: 1250
            },
            {
                sapCode: 189990011,
                productName: 'CLEARSOL PLUS (2PZA x 7.5HA)',
                quantity: 25,
                estimatedPrice: 1250
            }
        ],
        estimatedValue: 68750,
        probability: 70,
        expectedCloseDate: '2026-02-20',
        status: 'proposal',
        createdAt: '2026-01-28T13:30:00Z',
        updatedAt: '2026-02-08T10:45:00Z'
    },
    {
        id: 'opp-006',
        clientId: String(clients[12].cuenta),
        clientName: clients[12].razonSocial,
        title: 'Maíz VT3P para 500 Hectáreas',
        description: 'Gran oportunidad. Cliente con campo de 500 ha busca maíz VT3P. Posibilidad de venta recurrente.',
        saleType: 'partner',
        products: [
            {
                sapCode: 189000001,
                productName: 'MAÍZ HÍBRIDO ADV 8112 VT TRIPLE PRO PS',
                quantity: 80,
                estimatedPrice: 1550
            }
        ],
        estimatedValue: 124000,
        probability: 85,
        expectedCloseDate: '2026-02-18',
        status: 'negotiation',
        createdAt: '2026-01-22T10:15:00Z',
        updatedAt: '2026-02-08T15:00:00Z'
    },
    {
        id: 'opp-007',
        clientId: String(clients[15].cuenta),
        clientName: clients[15].razonSocial,
        title: 'Sorgo Granífero - Primera Compra',
        description: 'Cliente nuevo interesado en probar nuestros productos. Oportunidad de fidelización.',
        saleType: 'own',
        products: [
            {
                sapCode: 165060031,
                productName: 'HYBRID GRAIN SORGO ADV1153 IG PS',
                quantity: 25,
                estimatedPrice: 1350
            }
        ],
        estimatedValue: 33750,
        probability: 40,
        expectedCloseDate: '2026-03-15',
        status: 'prospecting',
        createdAt: '2026-02-05T11:00:00Z',
        updatedAt: '2026-02-05T11:00:00Z'
    },
    {
        id: 'opp-008',
        clientId: String(clients[18].cuenta),
        clientName: clients[18].razonSocial,
        title: 'Paquete Completo Campaña Gruesa',
        description: 'Cliente solicita cotización integral: maíz, sorgo y girasol. Oportunidad estratégica.',
        saleType: 'own',
        products: [
            {
                sapCode: 198000052,
                productName: '80-63TRE Band 2',
                quantity: 45,
                estimatedPrice: 1550
            },
            {
                sapCode: 162050086,
                productName: 'HYBRID FORAGE SORGO ADV2650 IG PS',
                quantity: 30,
                estimatedPrice: 1350
            },
            {
                sapCode: 165030229,
                productName: 'HYBRID SF ADV5205 CLHO G1 180K PS',
                quantity: 20,
                estimatedPrice: 1450
            }
        ],
        estimatedValue: 139250,
        probability: 90,
        expectedCloseDate: '2026-02-15',
        status: 'negotiation',
        createdAt: '2026-01-18T08:30:00Z',
        updatedAt: '2026-02-08T12:00:00Z'
    }
];
