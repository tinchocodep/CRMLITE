// Mock data for opportunities
export const mockOpportunities = [
    {
        id: 1,
        comercial: {
            id: 1,
            name: 'Juan Pérez',
            email: 'juan.perez@sailo.com'
        },
        opportunityName: 'Venta de Fertilizantes - Estancia La Pampa',
        linkedEntity: {
            type: 'client',
            id: 1,
            name: 'Estancia La Pampa'
        },
        contact: {
            id: 1,
            name: 'Roberto Fernández',
            email: 'roberto@estancialapampa.com',
            phone: '+54 11 5555-1234'
        },
        productType: 'Fertilizantes NPK',
        amount: 450000,
        closeDate: '2026-03-15',
        status: 'negociado',
        probability: 75,
        nextAction: 'Enviar propuesta final con descuento por volumen',
        nextActionDate: '2026-02-10',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-02-01T14:30:00Z',
        notes: 'Cliente interesado en compra para campaña de verano. Requiere financiación a 60 días.'
    },
    {
        id: 2,
        comercial: {
            id: 2,
            name: 'María González',
            email: 'maria.gonzalez@sailo.com'
        },
        opportunityName: 'Semillas de Soja - Agro San Martín',
        linkedEntity: {
            type: 'prospect',
            id: 3,
            name: 'Agro San Martín'
        },
        contact: {
            id: 5,
            name: 'Laura Gómez',
            email: 'laura@agrosanmartin.com',
            phone: '+54 11 5555-5678'
        },
        productType: 'Semillas de Soja RR',
        amount: 680000,
        closeDate: '2026-04-20',
        status: 'presupuestado',
        probability: 45,
        nextAction: 'Agendar visita técnica al campo',
        nextActionDate: '2026-02-12',
        createdAt: '2026-01-20T09:15:00Z',
        updatedAt: '2026-01-28T16:45:00Z',
        notes: 'Prospecto nuevo. Interesado en probar nuestras semillas en 100 hectáreas.'
    },
    {
        id: 3,
        comercial: {
            id: 1,
            name: 'Juan Pérez',
            email: 'juan.perez@sailo.com'
        },
        opportunityName: 'Agroquímicos - Campo Verde SA',
        linkedEntity: {
            type: 'client',
            id: 4,
            name: 'Campo Verde SA'
        },
        contact: {
            id: 8,
            name: 'Diego Morales',
            email: 'diego@campoverde.com',
            phone: '+54 11 5555-9012'
        },
        productType: 'Herbicidas y Fungicidas',
        amount: 320000,
        closeDate: '2026-02-28',
        status: 'ganado',
        probability: 100,
        nextAction: 'Coordinar entrega y facturación',
        nextActionDate: '2026-02-05',
        createdAt: '2026-01-10T11:30:00Z',
        updatedAt: '2026-02-02T10:00:00Z',
        notes: 'Oportunidad cerrada exitosamente. Cliente satisfecho con precio y condiciones.'
    },
    {
        id: 4,
        comercial: {
            id: 3,
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@sailo.com'
        },
        opportunityName: 'Maquinaria Agrícola - Los Robles',
        linkedEntity: {
            type: 'prospect',
            id: 6,
            name: 'Establecimiento Los Robles'
        },
        contact: {
            id: 12,
            name: 'Martín Suárez',
            email: 'martin@losrobles.com',
            phone: '+54 11 5555-3456'
        },
        productType: 'Pulverizadora Autopropulsada',
        amount: 2500000,
        closeDate: '2026-05-30',
        status: 'iniciado',
        probability: 25,
        nextAction: 'Presentar opciones de financiamiento',
        nextActionDate: '2026-02-15',
        createdAt: '2026-01-25T14:00:00Z',
        updatedAt: '2026-01-30T09:20:00Z',
        notes: 'Oportunidad de alto valor. Cliente evaluando varias opciones del mercado.'
    },
    {
        id: 5,
        comercial: {
            id: 4,
            name: 'Ana Martínez',
            email: 'ana.martinez@sailo.com'
        },
        opportunityName: 'Insumos Ganaderos - Estancia El Ombú',
        linkedEntity: {
            type: 'client',
            id: 7,
            name: 'Estancia El Ombú'
        },
        contact: {
            id: 15,
            name: 'Patricia Vega',
            email: 'patricia@elombu.com',
            phone: '+54 11 5555-7890'
        },
        productType: 'Suplementos Nutricionales',
        amount: 180000,
        closeDate: '2026-03-10',
        status: 'perdido',
        probability: 0,
        nextAction: 'Seguimiento para futuras oportunidades',
        nextActionDate: '2026-03-01',
        createdAt: '2026-01-05T08:45:00Z',
        updatedAt: '2026-02-01T17:30:00Z',
        notes: 'Cliente eligió competencia por mejor precio. Mantener relación para próxima temporada.'
    },
    {
        id: 6,
        comercial: {
            id: 2,
            name: 'María González',
            email: 'maria.gonzalez@sailo.com'
        },
        opportunityName: 'Granos - Cooperativa Agraria del Sur',
        linkedEntity: {
            type: 'client',
            id: 9,
            name: 'Cooperativa Agraria del Sur'
        },
        contact: {
            id: 18,
            name: 'Javier Romero',
            email: 'javier@cooperativasur.com',
            phone: '+54 11 5555-2345'
        },
        productType: 'Maíz y Trigo',
        amount: 1200000,
        closeDate: '2026-04-15',
        status: 'negociado',
        probability: 80,
        nextAction: 'Firmar contrato de compra',
        nextActionDate: '2026-02-08',
        createdAt: '2026-01-12T13:20:00Z',
        updatedAt: '2026-02-02T11:15:00Z',
        notes: 'Negociación avanzada. Cliente requiere garantía de calidad y entrega puntual.'
    }
];
