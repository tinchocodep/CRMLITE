export const mockProspects = [
    {
        id: 1,
        date: '2024-03-10T09:00:00',
        cuit: '30-71234567-8',
        companyName: 'Estancias del Sur S.A.',
        tradeName: 'Campo Sur',
        contact: 'juan.perez@agrosur.com', // Legacy field - mantener por compatibilidad
        phone: '+54 9 249 456-7890',
        city: 'Tandil',
        province: 'Buenos Aires',
        status: 'contacted',
        isActive: true,
        prospectStatus: 'active', // 'active' | 'converted'
        convertedToClientId: null,
        conversionDate: null,
        notes: 'Interesados en productos para cultivos de soja y maíz.',
        contacts: [
            {
                contactId: 1,
                contactName: 'Juan Pérez',
                role: 'Gerente Comercial',
                isPrimary: true
            },
            {
                contactId: 3,
                contactName: 'Carlos Rodríguez',
                role: 'Asesor Técnico',
                isPrimary: false
            },
            {
                contactId: 5,
                contactName: 'Roberto Fernández',
                role: 'Socio Inversor',
                isPrimary: false
            }
        ]
    },
    {
        id: 2,
        date: '2024-03-11T10:15:00',
        cuit: '20-35678901-4',
        companyName: 'Lucas Benetti',
        tradeName: 'Lucas Benetti',
        contact: 'lucas.benetti@gmail.com',
        phone: '+54 9 11 3456-7890',
        city: 'CABA',
        province: 'Buenos Aires',
        status: 'quoted',
        isActive: true,
        prospectStatus: 'active',
        convertedToClientId: null,
        conversionDate: null,
        notes: 'Productor independiente interesado en asesoramiento técnico.',
        contacts: []
    },
    {
        id: 3,
        date: '2024-03-12T14:30:00',
        cuit: '30-55678901-2',
        companyName: 'Constructora Vial Andes SRL',
        tradeName: 'Vial Andes',
        contact: 'maria.gonzalez@vialandes.com',
        phone: '+54 9 261 789-1234',
        city: 'Mendoza Capital',
        province: 'Mendoza',
        status: 'contacted',
        isActive: true,
        prospectStatus: 'active',
        convertedToClientId: null,
        conversionDate: null,
        notes: 'Presupuesto enviado para proyecto de infraestructura.',
        contacts: [
            {
                contactId: 2,
                contactName: 'María González',
                role: 'Directora de Compras',
                isPrimary: true
            },
            {
                contactId: 3,
                contactName: 'Carlos Rodríguez',
                role: 'Consultor Externo',
                isPrimary: false
            }
        ]
    },
    {
        id: 4,
        date: '2024-03-15T11:00:00',
        cuit: '27-98765432-1',
        companyName: 'Consultoría López y Asoc.',
        tradeName: 'López Consultores',
        contact: 'ana.lopez@gmail.com',
        phone: '+54 9 351 234-5678',
        city: 'Córdoba Capital',
        province: 'Córdoba',
        status: 'near_closing',
        isActive: true,
        prospectStatus: 'active',
        convertedToClientId: null,
        conversionDate: null,
        notes: 'Reunión de cierre pautada para próxima semana.',
        contacts: []
    },
    {
        id: 5,
        date: '2024-03-18T16:45:00',
        cuit: '33-55555555-4',
        companyName: 'Campo Viejo SRL',
        tradeName: 'Campo Viejo',
        contact: 'roberto.fernandez@inactive.com',
        phone: '+54 9 341 555-6789',
        city: 'Rosario',
        province: 'Santa Fe',
        status: 'contacted',
        isActive: false, // Empresa desactivada
        prospectStatus: 'active',
        convertedToClientId: null,
        conversionDate: null,
        notes: 'Empresa desactivada por falta de actividad.',
        contacts: [
            {
                contactId: 5,
                contactName: 'Roberto Fernández',
                role: 'Propietario',
                isPrimary: true
            }
        ]
    },
    {
        id: 6,
        date: '2024-02-20T10:00:00',
        cuit: '30-12345678-9',
        companyName: 'Agro Tech S.A.',
        tradeName: 'Agro Tech',
        contact: 'ana.martinez@example.com',
        phone: '+54 9 11 9876-5432',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        status: 'near_closing',
        isActive: true,
        prospectStatus: 'converted', // Prospecto convertido a cliente
        convertedToClientId: 999, // ID del cliente resultante
        conversionDate: '2024-03-01T12:00:00',
        notes: 'Convertido a cliente el 01/03/2024.',
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
