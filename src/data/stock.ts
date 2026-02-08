import { StockMovement, StockBalance } from '../types/cotizador';
import { orders } from './orders';
import { products } from './products';

// Movimientos de Stock - Ingresos
export const stockMovementsIn: StockMovement[] = [
    {
        id: 'stock-in-001',
        type: 'in',
        stockType: 'own',
        origin: 'Proveedor Semillas del Sur S.A.',
        destination: 'Depósito Central - Av. Libertador 1500, CABA',
        transportCompany: 'Transportes Rápido S.A.',
        driverName: 'Carlos Mendez',
        vehiclePlate: 'AB123CD',
        movementDate: '2026-01-15',
        supplierRemitNumber: 'REM-2026-0045',
        lines: [
            {
                id: 'line-1',
                productSapCode: 198000053,
                productName: '80-63TRE Band 3',
                quantity: 500,
                volume: 10.0,
                batchNumber: 'LOTE-2026-001',
                expiryDate: '2027-12-31'
            },
            {
                id: 'line-2',
                productSapCode: 189001354,
                productName: 'MAIZ HIBRIDO 80-63TRE C4 (C3L) PS',
                quantity: 300,
                volume: 6.0,
                batchNumber: 'LOTE-2026-002',
                expiryDate: '2027-12-31'
            }
        ],
        createdAt: '2026-01-15T10:30:00Z'
    },
    {
        id: 'stock-in-002',
        type: 'in',
        stockType: 'consigned',
        origin: 'Advanta Semillas Argentina',
        destination: 'Depósito Norte - Ruta 11 Km 1200, Santa Fe',
        transportCompany: 'Logística Pampa',
        driverName: 'Roberto Gomez',
        vehiclePlate: 'EF456GH',
        movementDate: '2026-01-20',
        supplierRemitNumber: 'ADV-REM-0123',
        lines: [
            {
                id: 'line-1',
                productSapCode: 162050086,
                productName: 'HYBRID FORAGE SORGO ADV2650 IG PS',
                quantity: 400,
                volume: 8.0,
                batchNumber: 'LOTE-2026-003'
            },
            {
                id: 'line-2',
                productSapCode: 165030229,
                productName: 'HYBRID SF ADV5205 CLHO G1 180K PS',
                quantity: 250,
                volume: 5.0,
                batchNumber: 'LOTE-2026-004'
            }
        ],
        createdAt: '2026-01-20T14:15:00Z'
    }
];

// Movimientos de Stock - Egresos (relacionados con pedidos)
export const stockMovementsOut: StockMovement[] = [
    {
        id: 'stock-out-001',
        type: 'out',
        stockType: 'own',
        orderId: orders[0].id,
        origin: 'Depósito Central - Av. Libertador 1500, CABA',
        destination: orders[0].destinationAddress,
        transportCompany: 'Transportes del Norte',
        driverName: 'Juan Perez',
        vehiclePlate: 'IJ789KL',
        movementDate: '2026-02-10',
        remitNumber: 'REM-OUT-2026-001',
        lines: orders[0].lines.map((line, index) => ({
            id: `line-${index + 1}`,
            productSapCode: line.productSapCode,
            productName: line.productName,
            quantity: line.quantity,
            volume: line.volume,
            batchNumber: `LOTE-2026-00${index + 1}`
        })),
        createdAt: '2026-02-10T09:30:00Z'
    },
    {
        id: 'stock-out-002',
        type: 'out',
        stockType: 'own',
        orderId: orders[1].id,
        origin: 'Depósito Sur - Av. Circunvalación 2300, Córdoba',
        destination: orders[1].destinationAddress,
        transportCompany: 'Expreso Pampeano',
        driverName: 'Miguel Torres',
        vehiclePlate: 'MN012OP',
        movementDate: '2026-02-06',
        remitNumber: 'REM-OUT-2026-002',
        lines: orders[1].lines.map((line, index) => ({
            id: `line-${index + 1}`,
            productSapCode: line.productSapCode,
            productName: line.productName,
            quantity: line.quantity,
            volume: line.volume,
            batchNumber: `LOTE-2026-00${index + 2}`
        })),
        createdAt: '2026-02-06T10:15:00Z'
    }
];

// Balance de Stock actual - TODOS LOS PRODUCTOS
export const stockBalances: StockBalance[] = [
    // Canola
    {
        productSapCode: 166040120,
        productName: 'CONTINUUM CL Standard 20kg',
        cropDescription: 'Canola',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 150,
        exits: 0,
        balance: 150
    },
    {
        productSapCode: 162040067,
        productName: 'Hybrid C Hyola 433 PS',
        cropDescription: 'Canola',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 120,
        exits: 15,
        balance: 105
    },
    {
        productSapCode: 162040071,
        productName: 'Hybrid C Hyola 575CL PS',
        cropDescription: 'Canola',
        stockType: 'own',
        warehouse: 'Depósito Norte',
        entries: 180,
        exits: 20,
        balance: 160
    },
    {
        productSapCode: 163040011,
        productName: 'Hybrid C Hyola 575CL x 20 Kg PS',
        cropDescription: 'Canola',
        stockType: 'consigned',
        warehouse: 'Depósito Sur',
        entries: 200,
        exits: 35,
        balance: 165
    },
    // Químicos
    {
        productSapCode: 189990009,
        productName: 'CLEARSOL DF 2PZ x 0.6 Kg',
        cropDescription: 'Químicos',
        stockType: 'own',
        warehouse: 'Depósito Sur',
        entries: 200,
        exits: 15,
        balance: 185
    },
    {
        productSapCode: 189990011,
        productName: 'CLEARSOL PLUS (2PZA x 7.5HA)',
        cropDescription: 'Químicos',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 150,
        exits: 25,
        balance: 125
    },
    {
        productSapCode: 189990010,
        productName: 'Dash MSO MAX (4u x 5L)',
        cropDescription: 'Químicos',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 180,
        exits: 30,
        balance: 150
    },
    {
        productSapCode: 191000537,
        productName: 'IMATRON FORESTAL CJ 4 X 5 LTS',
        cropDescription: 'Químicos',
        stockType: 'consigned',
        warehouse: 'Depósito Norte',
        entries: 100,
        exits: 10,
        balance: 90
    },
    {
        productSapCode: 189990008,
        productName: 'Mayoral CJ. 4u X 5 Lts.',
        cropDescription: 'Químicos',
        stockType: 'own',
        warehouse: 'Depósito Sur',
        entries: 220,
        exits: 40,
        balance: 180
    },
    // Maíz - ADV 80-63 TRE
    {
        productSapCode: 198000053,
        productName: '80-63TRE Band 3',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 500,
        exits: 40,
        balance: 460
    },
    {
        productSapCode: 198000052,
        productName: '80-63TRE Band 2',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 450,
        exits: 35,
        balance: 415
    },
    {
        productSapCode: 189001354,
        productName: 'MAIZ HIBRIDO 80-63TRE C4 (C3L) PS',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 300,
        exits: 30,
        balance: 270
    },
    {
        productSapCode: 189001353,
        productName: 'MAIZ HIBRIDO 80-63TRE C2 (C2L/C2C) PS',
        cropDescription: 'Maíz',
        stockType: 'consigned',
        warehouse: 'Depósito Norte',
        entries: 280,
        exits: 25,
        balance: 255
    },
    {
        productSapCode: 189001355,
        productName: 'MAIZ HIBRIDO 80-63TRE C4C (C3C) PS',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Sur',
        entries: 320,
        exits: 40,
        balance: 280
    },
    {
        productSapCode: 189001356,
        productName: 'MAIZ HIBRIDO 80-63TRE C5 (C4L) PS',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 350,
        exits: 50,
        balance: 300
    },
    {
        productSapCode: 189001357,
        productName: 'MAIZ HIBRIDO 80-63TRE SPC PS',
        cropDescription: 'Maíz',
        stockType: 'consigned',
        warehouse: 'Depósito Norte',
        entries: 200,
        exits: 20,
        balance: 180
    },
    {
        productSapCode: 189001358,
        productName: 'MAIZ HIBRIDO 80-63TRE  R2 (R2L/R2C) PS',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 400,
        exits: 45,
        balance: 355
    },
    {
        productSapCode: 189001359,
        productName: 'MAIZ HIBRIDO 80-63TRE  R4 (R3) PS',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Sur',
        entries: 380,
        exits: 55,
        balance: 325
    },
    {
        productSapCode: 189001360,
        productName: 'MAIZ HIBRIDO 80-63TRE R4C (R3C) PS',
        cropDescription: 'Maíz',
        stockType: 'consigned',
        warehouse: 'Depósito Norte',
        entries: 290,
        exits: 30,
        balance: 260
    },
    {
        productSapCode: 189001361,
        productName: 'MAIZ HIBRIDO 80-63TRE R5 (R4) PS',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 420,
        exits: 60,
        balance: 360
    },
    {
        productSapCode: 189001362,
        productName: 'MAIZ HIBRIDO 80-63TRE  SPR PS',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Sur',
        entries: 310,
        exits: 35,
        balance: 275
    },
    {
        productSapCode: 198000051,
        productName: '80-63TRE Band 1',
        cropDescription: 'Maíz',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 480,
        exits: 50,
        balance: 430
    },
    {
        productSapCode: 189001380,
        productName: 'MAIZ HIBRIDO 80-63TRE R1 PS',
        cropDescription: 'Maíz',
        stockType: 'consigned',
        warehouse: 'Depósito Norte',
        entries: 340,
        exits: 40,
        balance: 300
    },
    // Sorgo Forrajero
    {
        productSapCode: 162050086,
        productName: 'HYBRID FORAGE SORGO ADV2650 IG PS',
        cropDescription: 'Sorgo Forrajero',
        stockType: 'consigned',
        warehouse: 'Depósito Norte',
        entries: 400,
        exits: 25,
        balance: 375
    },
    {
        productSapCode: 162050430,
        productName: 'HYBRID FS ADV2800 x 20 KG PS',
        cropDescription: 'Sorgo Forrajero',
        stockType: 'own',
        warehouse: 'Depósito Sur',
        entries: 350,
        exits: 30,
        balance: 320
    },
    // Girasol
    {
        productSapCode: 165030229,
        productName: 'HYBRID SF ADV5205 CLHO G1 180K PS',
        cropDescription: 'Girasol',
        stockType: 'consigned',
        warehouse: 'Depósito Norte',
        entries: 250,
        exits: 0,
        balance: 250
    },
    {
        productSapCode: 167030229,
        productName: 'HYBRID SF ADV5205 CLHO G2 180K PS',
        cropDescription: 'Girasol',
        stockType: 'own',
        warehouse: 'Depósito Central',
        entries: 280,
        exits: 20,
        balance: 260
    }
];
