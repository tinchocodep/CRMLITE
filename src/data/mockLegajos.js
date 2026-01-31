export const mockLegajos = [
    {
        id: 1,
        clientId: 1, // Estancias del Sur
        status: 'incomplete', // or 'complete', 'pending_call'
        documents: {
            dni_front: { status: 'uploaded', url: '/mocks/dni_front.jpg', date: '2024-01-15' },
            dni_back: { status: 'uploaded', url: '/mocks/dni_back.jpg', date: '2024-01-15' },
            selfie: { status: 'missing', url: null, date: null },
            cbu_proof: { status: 'uploaded', url: '/mocks/cbu.pdf', date: '2024-01-20' },
            iibb_exemption: { status: 'expired', url: '/mocks/iibb.pdf', date: '2023-12-01' },
            f1276: { status: 'missing', url: null, date: null }
        },
        updatedAt: '2024-01-20T10:30:00Z',
        notes: 'Falta selfie para validación biométrica.'
    },
    {
        id: 2,
        clientId: 2, // Vial Andes
        status: 'complete',
        documents: {
            dni_front: { status: 'uploaded', url: '#', date: '2024-02-01' },
            dni_back: { status: 'uploaded', url: '#', date: '2024-02-01' },
            selfie: { status: 'uploaded', url: '#', date: '2024-02-01' },
            cbu_proof: { status: 'uploaded', url: '#', date: '2024-02-01' },
            iibb_exemption: { status: 'uploaded', url: '#', date: '2024-02-01' },
            f1276: { status: 'uploaded', url: '#', date: '2024-02-01' }
        },
        updatedAt: '2024-02-01T15:45:00Z',
        notes: 'Documentación completa revisada.'
    }
];
