export const mockClients = [
    {
        id: 1,
        legalName: 'Estancias del Sur S.A.',
        tradeName: 'Campo Sur',
        cuit: '30-11223344-5',
        city: 'Tandil',
        province: 'Buenos Aires',
        address: 'Ruta 226 Km 150',
        businessUnit: 'agro',
        commercialRep: 'Martin G.',
        fileNumber: '2024-001',
        segments: [
            { id: 101, name: 'La Negrita', hectares: 1500, crops: 'Trigo, Soja', machinery: '3 Tractores JD' },
            { id: 102, name: 'El Bajo', hectares: 500, crops: 'Maíz', machinery: '1 Cosechadora' }
        ],
        importance: 'high', // high, medium, low
        detail: 'Cliente histórico, paga contado.',
        isActive: true,
        convertedFrom: null,
        conversionDate: null,
        contacts: []
    },
    {
        id: 2,
        legalName: 'Constructora Vial Andes SRL',
        tradeName: 'Vial Andes',
        cuit: '33-99887766-1',
        city: 'Mendoza Capital',
        province: 'Mendoza',
        address: 'Av. San Martín 4000',
        businessUnit: 'construccion',
        commercialRep: 'Juan P.',
        fileNumber: '2024-045',
        segments: [
            { id: 201, name: 'Obrados Misiones', hectares: 0, crops: '-', machinery: 'Flota Vial Completa' }
        ],
        importance: 'medium',
        detail: 'Licitaciones públicas.',
        isActive: true,
        convertedFrom: null,
        conversionDate: null,
        contacts: []
    },
    {
        id: 999,
        legalName: 'Agro Tech S.A.',
        tradeName: 'Agro Tech',
        cuit: '30-12345678-9',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        address: 'Av. Corrientes 1234',
        businessUnit: 'agro',
        commercialRep: 'Martin G.',
        fileNumber: '2024-078',
        segments: [
            { id: 301, name: 'Campo Norte', hectares: 2000, crops: 'Soja, Trigo', machinery: '5 Tractores' }
        ],
        importance: 'high',
        detail: 'Cliente convertido desde prospecto.',
        isActive: true,
        convertedFrom: 5, // ID del prospecto original
        conversionDate: '2024-03-01T12:00:00',
        contacts: [
            {
                contactId: 4,
                contactName: 'Ana Martínez',
                role: 'Gerente General',
                isPrimary: true
            }
        ]
    }
];
