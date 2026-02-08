// ============================================
// TIPOS BASE
// ============================================

export interface Client {
    id: string;
    name: string;
    cuit: string;
    address: string;
    city: string;
    province: string;
    phone: string;
    email: string;
}

export interface Product {
    sapCode: number;
    cropDescription: string;
    hybridName: string;
    hybridNameAtSkuLevel: string;
    precio: number;
}

// ============================================
// COTIZACIONES
// ============================================

export type SaleType = 'own' | 'partner';
export type PaymentCondition = 'cash' | '30d' | '60d' | '90d' | 'custom';
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'revision';

export interface QuotationLine {
    id: string;
    productSapCode: number;
    productName: string;
    quantity: number;
    volume: number;
    unitPrice: number;
    subtotal: number;
    taxRate: number;
    total: number;
}

export interface Quotation {
    id: string;
    number: string;
    clientId: string;
    clientName: string;
    saleType: SaleType;
    paymentCondition: PaymentCondition;
    deliveryDate: string;
    originAddress: string;
    destinationAddress: string;
    status: QuotationStatus;
    lines: QuotationLine[];
    subtotal: number;
    tax: number;
    total: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// PEDIDOS (COTIZACIONES CONFIRMADAS)
// ============================================

export type OrderStatus = 'pending' | 'shipped' | 'invoiced' | 'paid' | 'completed';

export interface Order {
    id: string;
    orderNumber: string;
    quotationId: string;
    clientId: string;
    clientName: string;
    clientCuit?: string;
    saleType: SaleType;
    paymentCondition: PaymentCondition;
    deliveryDate: string;
    originAddress: string;
    destinationAddress: string;
    status: OrderStatus;
    lines: QuotationLine[];
    subtotal: number;
    tax: number;
    total: number;
    createdAt: string;
    shippedAt?: string;
    invoicedAt?: string;
    paidAt?: string;
}

// ============================================
// STOCK
// ============================================

export type StockMovementType = 'in' | 'out';
export type StockType = 'own' | 'consigned';

export interface StockMovementLine {
    id: string;
    productSapCode: number;
    productName: string;
    quantity: number;
    volume: number;
    batchNumber?: string;
    expiryDate?: string;
}

export interface StockMovement {
    id: string;
    type: StockMovementType;
    stockType: StockType;
    orderId?: string;
    origin: string;
    destination: string;
    transportCompany: string;
    driverName: string;
    vehiclePlate: string;
    movementDate: string;
    remitNumber?: string;
    supplierRemitNumber?: string;
    lines: StockMovementLine[];
    createdAt: string;
}

export interface StockBalance {
    productSapCode: number;
    productName: string;
    cropDescription: string;
    stockType: StockType;
    warehouse: string;
    entries: number;
    exits: number;
    balance: number;
}

// ============================================
// FACTURAS
// ============================================

export type InvoiceType = 'A' | 'B' | 'C' | 'NC_A' | 'NC_B' | 'NC_C' | 'ND_A' | 'ND_B' | 'ND_C';

export interface InvoiceLine {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    taxRate: number;
    total: number;
}

export interface Invoice {
    id: string;
    orderId: string;
    clientId: string;
    clientName: string;
    invoiceType: InvoiceType;
    isAfip: boolean; // true = propia, false = proforma
    partnerInvoiceRef?: string;
    pointOfSale: string;
    invoiceNumber: string;
    cae?: string;
    caeExpiry?: string;
    issueDate: string;
    paymentCondition: PaymentCondition;
    lines: InvoiceLine[];
    subtotal: number;
    tax: number;
    total: number;
    createdAt: string;
}

// ============================================
// PAGOS
// ============================================

export type PaymentMethod = 'cash' | 'check' | 'transfer';

export interface Payment {
    id: string;
    clientId: string;
    clientName: string;
    paymentMethod: PaymentMethod;
    amount: number;
    paymentDate: string;
    receiptNumber: string;
    // Campos específicos por método
    bankName?: string;
    checkNumber?: string;
    checkDueDate?: string;
    transferOperation?: string;
    cbuCvuOrigin?: string;
    payerName?: string;
    createdAt: string;
}

export interface PaymentAllocation {
    id: string;
    paymentId: string;
    invoiceId: string;
    invoiceNumber: string;
    allocatedAmount: number;
}

// ============================================
// CUENTA CORRIENTE
// ============================================

export type AccountMovementType = 'invoice' | 'credit_note' | 'debit_note' | 'payment';

export interface AccountMovement {
    id: string;
    clientId: string;
    date: string;
    type: AccountMovementType;
    documentType: string;
    documentNumber: string;
    debit: number;
    credit: number;
    balance: number;
    relatedDocumentId: string; // ID de factura o pago
    description: string;
}

export interface AccountSummary {
    clientId: string;
    clientName: string;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    movements: AccountMovement[];
}
