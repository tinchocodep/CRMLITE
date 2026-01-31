// Mock data for contacts
export const mockContacts = [
    {
        id: 1,
        firstName: "Juan",
        lastName: "Pérez",
        email: "juan.perez@agrosur.com",
        phone: "+54 9 11 4567-8901",
        avatar: null,
        companies: [
            {
                companyId: 1,
                companyName: "Campo Sur",
                companyType: "prospect",
                companyStatus: "active",
                isCompanyActive: true,
                role: "Gerente Comercial",
                isPrimary: true,
                addedDate: "2024-01-15"
            }
        ],
        notes: "Especialista en cultivos de soja y maíz. Muy interesado en nuevas tecnologías.",
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-03-10T15:45:00Z"
    },
    {
        id: 2,
        firstName: "María",
        lastName: "González",
        email: "maria.gonzalez@vialandes.com",
        phone: "+54 9 261 555-1234",
        avatar: null,
        companies: [
            {
                companyId: 2,
                companyName: "Vial Andes",
                companyType: "prospect",
                companyStatus: "active",
                isCompanyActive: true,
                role: "Directora de Compras",
                isPrimary: true,
                addedDate: "2024-02-01"
            }
        ],
        notes: "Contacto clave para decisiones de compra. Prefiere comunicación por email.",
        createdAt: "2024-02-01T09:00:00Z",
        updatedAt: "2024-02-01T09:00:00Z"
    },
    {
        id: 3,
        firstName: "Carlos",
        lastName: "Rodríguez",
        email: "carlos.rodriguez@consultor.com",
        phone: "+54 9 11 2345-6789",
        avatar: null,
        companies: [
            {
                companyId: 1,
                companyName: "Campo Sur",
                companyType: "prospect",
                companyStatus: "active",
                isCompanyActive: true,
                role: "Asesor Técnico",
                isPrimary: false,
                addedDate: "2024-01-20"
            },
            {
                companyId: 2,
                companyName: "Vial Andes",
                companyType: "prospect",
                companyStatus: "active",
                isCompanyActive: true,
                role: "Consultor Externo",
                isPrimary: false,
                addedDate: "2024-02-15"
            }
        ],
        notes: "Consultor independiente que trabaja con múltiples empresas del sector.",
        createdAt: "2024-01-20T14:20:00Z",
        updatedAt: "2024-02-15T11:30:00Z"
    },
    {
        id: 4,
        firstName: "Ana",
        lastName: "Martínez",
        email: "ana.martinez@example.com",
        phone: "+54 9 11 8765-4321",
        avatar: null,
        companies: [
            {
                companyId: 3,
                companyName: "Agro Tech SA",
                companyType: "client",
                companyStatus: "active",
                isCompanyActive: true,
                role: "Gerente General",
                isPrimary: true,
                addedDate: "2023-11-10"
            }
        ],
        notes: "Cliente de larga data. Muy satisfecha con el servicio.",
        createdAt: "2023-11-10T08:00:00Z",
        updatedAt: "2024-01-05T16:20:00Z"
    },
    {
        id: 5,
        firstName: "Roberto",
        lastName: "Fernández",
        email: "roberto.fernandez@inactive.com",
        phone: "+54 9 341 777-8888",
        avatar: null,
        companies: [
            {
                companyId: 4,
                companyName: "Campo Viejo SRL",
                companyType: "prospect",
                companyStatus: "active",
                isCompanyActive: false,
                role: "Propietario",
                isPrimary: true,
                addedDate: "2023-06-01"
            },
            {
                companyId: 1,
                companyName: "Campo Sur",
                companyType: "prospect",
                companyStatus: "active",
                isCompanyActive: true,
                role: "Socio Inversor",
                isPrimary: false,
                addedDate: "2024-01-25"
            }
        ],
        notes: "Tiene una empresa desactivada pero sigue activo en Campo Sur.",
        createdAt: "2023-06-01T10:00:00Z",
        updatedAt: "2024-01-25T12:00:00Z"
    }
];
