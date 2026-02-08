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
    saleType: 'own' | 'advanta';
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
        saleType: 'advanta',
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
        saleType: 'advanta',
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
    },
    {
        id: 'opp-009',
        clientId: String(clients[3].cuenta),
        clientName: clients[3].razonSocial,
        title: 'Semillas de Soja para 300 Hectáreas',
        description: 'Cliente requiere semillas de soja de alta calidad. Busca variedades resistentes a sequía.',
        saleType: 'own',
        products: [
            {
                sapCode: 198000052,
                productName: '80-63TRE Band 2',
                quantity: 60,
                estimatedPrice: 1550
            }
        ],
        estimatedValue: 93000,
        probability: 65,
        expectedCloseDate: '2026-03-01',
        status: 'proposal',
        createdAt: '2026-02-02T10:00:00Z',
        updatedAt: '2026-02-07T14:00:00Z'
    },
    {
        id: 'opp-010',
        clientId: String(clients[6].cuenta),
        clientName: clients[6].razonSocial,
        title: 'Herbicidas para Control Pre-Emergente',
        description: 'Necesidad urgente de herbicidas. Cliente con historial de compras recurrentes.',
        saleType: 'own',
        products: [
            {
                sapCode: 189990011,
                productName: 'CLEARSOL PLUS (2PZA x 7.5HA)',
                quantity: 40,
                estimatedPrice: 1250
            }
        ],
        estimatedValue: 50000,
        probability: 85,
        expectedCloseDate: '2026-02-22',
        status: 'negotiation',
        createdAt: '2026-02-04T09:30:00Z',
        updatedAt: '2026-02-08T11:00:00Z'
    },
    {
        id: 'opp-011',
        clientId: String(clients[9].cuenta),
        clientName: clients[9].razonSocial,
        title: 'Maíz VT Triple Pro - Campaña Completa',
        description: 'Gran oportunidad. Cliente planifica 800 hectáreas de maíz.',
        saleType: 'advanta',
        products: [
            {
                sapCode: 189000001,
                productName: 'MAÍZ HÍBRIDO ADV 8112 VT TRIPLE PRO PS',
                quantity: 100,
                estimatedPrice: 1550
            }
        ],
        estimatedValue: 155000,
        probability: 90,
        expectedCloseDate: '2026-02-20',
        status: 'negotiation',
        createdAt: '2026-01-29T08:00:00Z',
        updatedAt: '2026-02-08T16:30:00Z'
    },
    {
        id: 'opp-012',
        clientId: String(clients[11].cuenta),
        clientName: clients[11].razonSocial,
        title: 'Sorgo Granífero - Prueba de Producto',
        description: 'Cliente nuevo interesado en probar sorgo granífero. Potencial de crecimiento.',
        saleType: 'own',
        products: [
            {
                sapCode: 165060031,
                productName: 'HYBRID GRAIN SORGO ADV1153 IG PS',
                quantity: 20,
                estimatedPrice: 1350
            }
        ],
        estimatedValue: 27000,
        probability: 45,
        expectedCloseDate: '2026-03-12',
        status: 'qualification',
        createdAt: '2026-02-06T13:00:00Z',
        updatedAt: '2026-02-06T13:00:00Z'
    },
    {
        id: 'opp-013',
        clientId: String(clients[13].cuenta),
        clientName: clients[13].razonSocial,
        title: 'Girasol Confitero - Pedido Especial',
        description: 'Requiere girasol confitero para exportación. Precio sensible.',
        saleType: 'own',
        products: [
            {
                sapCode: 167030229,
                productName: 'HYBRID SF ADV5205 CLHO G2 180K PS',
                quantity: 35,
                estimatedPrice: 1450
            }
        ],
        estimatedValue: 50750,
        probability: 55,
        expectedCloseDate: '2026-03-08',
        status: 'proposal',
        createdAt: '2026-02-03T11:00:00Z',
        updatedAt: '2026-02-05T15:00:00Z'
    },
    {
        id: 'opp-014',
        clientId: String(clients[14].cuenta),
        clientName: clients[14].razonSocial,
        title: 'Canola CL - Siembra Anticipada',
        description: 'Cliente adelanta siembra. Necesita entrega urgente.',
        saleType: 'own',
        products: [
            {
                sapCode: 162040067,
                productName: 'Hybrid C Hyola 433 PS',
                quantity: 25,
                estimatedPrice: 1250
            },
            {
                sapCode: 166040120,
                productName: 'CONTINUUM CL Standard 20kg',
                quantity: 15,
                estimatedPrice: 1250
            }
        ],
        estimatedValue: 50000,
        probability: 75,
        expectedCloseDate: '2026-02-25',
        status: 'negotiation',
        createdAt: '2026-02-01T14:30:00Z',
        updatedAt: '2026-02-07T10:00:00Z'
    },
    {
        id: 'opp-015',
        clientId: String(clients[16].cuenta),
        clientName: clients[16].razonSocial,
        title: 'Paquete Tecnológico Completo',
        description: 'Oportunidad estratégica: semillas + químicos. Cliente VIP.',
        saleType: 'advanta',
        products: [
            {
                sapCode: 198000053,
                productName: '80-63TRE Band 3',
                quantity: 50,
                estimatedPrice: 1550
            },
            {
                sapCode: 189990009,
                productName: 'CLEARSOL DF 2PZ x 0.6 Kg',
                quantity: 30,
                estimatedPrice: 1250
            }
        ],
        estimatedValue: 115000,
        probability: 80,
        expectedCloseDate: '2026-02-28',
        status: 'negotiation',
        createdAt: '2026-01-26T09:00:00Z',
        updatedAt: '2026-02-08T13:45:00Z'
    },
    {
        id: 'opp-016',
        clientId: String(clients[17].cuenta),
        clientName: clients[17].razonSocial,
        title: 'Sorgo Forrajero - Ganadería',
        description: 'Cliente ganadero necesita sorgo forrajero. Primera compra del año.',
        saleType: 'own',
        products: [
            {
                sapCode: 162050086,
                productName: 'HYBRID FORAGE SORGO ADV2650 IG PS',
                quantity: 40,
                estimatedPrice: 1350
            }
        ],
        estimatedValue: 54000,
        probability: 60,
        expectedCloseDate: '2026-03-05',
        status: 'proposal',
        createdAt: '2026-02-05T10:30:00Z',
        updatedAt: '2026-02-08T09:00:00Z'
    },
    {
        id: 'opp-017',
        clientId: String(clients[19].cuenta),
        clientName: clients[19].razonSocial,
        title: 'Maíz Tardío - Lote Experimental',
        description: 'Cliente quiere probar maíz tardío en lote experimental de 100 ha.',
        saleType: 'own',
        products: [
            {
                sapCode: 189001354,
                productName: 'MAIZ HIBRIDO 80-63TRE C4 (C3L) PS',
                quantity: 25,
                estimatedPrice: 1550
            }
        ],
        estimatedValue: 38750,
        probability: 50,
        expectedCloseDate: '2026-03-15',
        status: 'qualification',
        createdAt: '2026-02-07T15:00:00Z',
        updatedAt: '2026-02-07T15:00:00Z'
    },
    {
        id: 'opp-018',
        clientId: String(clients[7].cuenta),
        clientName: clients[7].razonSocial,
        title: 'Girasol Alto Oleico - Contrato Industria',
        description: 'Contrato con industria aceitera. Volumen importante garantizado.',
        saleType: 'advanta',
        products: [
            {
                sapCode: 165030229,
                productName: 'HYBRID SF ADV5205 CLHO G1 180K PS',
                quantity: 80,
                estimatedPrice: 1450
            }
        ],
        estimatedValue: 116000,
        probability: 95,
        expectedCloseDate: '2026-02-18',
        status: 'negotiation',
        createdAt: '2026-01-24T11:00:00Z',
        updatedAt: '2026-02-08T14:20:00Z'
    },
    {
        id: 'opp-019',
        clientId: String(clients[4].cuenta),
        clientName: clients[4].razonSocial,
        title: 'Químicos Post-Emergente',
        description: 'Necesidad de herbicidas post-emergente. Entrega inmediata.',
        saleType: 'own',
        products: [
            {
                sapCode: 189990011,
                productName: 'CLEARSOL PLUS (2PZA x 7.5HA)',
                quantity: 20,
                estimatedPrice: 1250
            }
        ],
        estimatedValue: 25000,
        probability: 70,
        expectedCloseDate: '2026-02-24',
        status: 'proposal',
        createdAt: '2026-02-06T16:00:00Z',
        updatedAt: '2026-02-08T10:30:00Z'
    },
    {
        id: 'opp-020',
        clientId: String(clients[1].cuenta),
        clientName: clients[1].razonSocial,
        title: 'Renovación Contrato Anual',
        description: 'Cliente histórico. Renovación de contrato anual. Muy alta probabilidad.',
        saleType: 'own',
        products: [
            {
                sapCode: 198000053,
                productName: '80-63TRE Band 3',
                quantity: 70,
                estimatedPrice: 1550
            },
            {
                sapCode: 162050086,
                productName: 'HYBRID FORAGE SORGO ADV2650 IG PS',
                quantity: 50,
                estimatedPrice: 1350
            }
        ],
        estimatedValue: 176000,
        probability: 95,
        expectedCloseDate: '2026-02-16',
        status: 'negotiation',
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-02-08T15:00:00Z'
    }
];
