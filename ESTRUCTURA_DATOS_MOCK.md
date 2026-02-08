# Estructura de Datos Mock - Módulo Cotizador

## 📋 Resumen

Se ha creado una estructura completa de datos mock para simular todo el flujo comercial del módulo Cotizador, desde Oportunidades hasta Cuenta Corriente.

## 🗂️ Archivos Creados

### 1. Tipos TypeScript (`src/types/cotizador.ts`)
Define todas las interfaces y tipos para:
- Clientes
- Productos
- Oportunidades
- Cotizaciones
- Pedidos
- Stock
- Facturas
- Pagos
- Cuenta Corriente

### 2. Datos Mock (`src/data/`)

#### `clients.ts`
- **20 clientes** con datos completos
- Incluye: cuenta, CUIT, razón social, contacto (nombre, teléfono, email)

#### `products.ts`
- **27 productos** del catálogo Advanta
- Categorías: Maíz, Canola, Químicos, Sorgo, Girasol
- Incluye: SAP Code, descripción, nombre híbrido, precio

#### `opportunities.ts`
- **8 oportunidades** de venta
- Estados: prospecting, qualification, proposal, negotiation
- Relacionadas con clientes y productos del stock
- **FLUJO**: Cuando se marca como "Ganado" → Se crea Cotización

#### `quotations.ts`
- **8 cotizaciones** generadas
- Estados: draft, sent, approved, rejected, revision
- Relacionadas con clientes y productos
- Cálculo automático de subtotales, impuestos y totales

#### `orders.ts`
- **5 pedidos** (cotizaciones confirmadas)
- Estados: pending, shipped, invoiced, paid, completed
- Incluye fechas de remisión, facturación y pago

#### `stock.ts`
- **2 ingresos** de stock (propio y consignado)
- **2 egresos** de stock (relacionados con pedidos)
- **6 balances** de productos con entradas, salidas y saldo actual

#### `invoices.ts`
- **3 facturas** (2 AFIP + 1 Proforma)
- Incluye CAE, vencimiento CAE, punto de venta
- **3 pagos** (transferencia, efectivo, cheque)
- **3 asignaciones** de pagos a facturas
- **6 movimientos** de cuenta corriente

## 🔄 Flujo Completo del Sistema

```
1. OPORTUNIDADES (CRM)
   ↓ [Botón "Marcar como Ganado"]
   
2. COTIZACIONES
   - Se crea automáticamente desde oportunidad ganada
   - Estados: Borrador → Enviada → Aprobada/Rechazada
   ↓ [Botón "Confirmar Cotización"]
   
3. PEDIDOS
   - Se genera desde cotización aprobada
   - Dispara 3 acciones:
   ├─→ REMITIR (Egreso de Stock)
   ├─→ FACTURAR (Genera Comprobante)
   └─→ COBRAR (Registra Pago)
   
4. STOCK
   - Ingresos: Desde proveedores
   - Egresos: Desde pedidos
   - Balance: Consulta en tiempo real
   
5. FACTURAS
   - Propias: Con CAE y QR (AFIP)
   - Proformas: Sin validez fiscal (Partner)
   
6. PAGOS
   - Métodos: Efectivo, Cheque, Transferencia
   - Asignación a facturas
   
7. CUENTA CORRIENTE
   - Consolidado de facturas y pagos
   - Saldo por cliente
```

## 📊 Estadísticas de Datos Mock

| Módulo | Cantidad | Detalles |
|--------|----------|----------|
| Clientes | 20 | Con contactos completos |
| Productos | 27 | Catálogo Advanta |
| Oportunidades | 8 | 6 activas, listas para ganar |
| Cotizaciones | 8 | Varios estados |
| Pedidos | 5 | Diferentes niveles de completitud |
| Ingresos Stock | 2 | Propio y consignado |
| Egresos Stock | 2 | Relacionados con pedidos |
| Facturas | 3 | 2 AFIP + 1 Proforma |
| Pagos | 3 | Diferentes métodos |
| Movimientos CC | 6 | Por 3 clientes |

## 🎯 Próximos Pasos

### Fase 1: Oportunidades (PRIORITARIO)
1. ✅ Crear datos mock de oportunidades
2. ⏳ Modificar página `Opportunities.jsx`
3. ⏳ Agregar botón "Marcar como Ganado"
4. ⏳ Implementar lógica para crear cotización automáticamente

### Fase 2: Cotizaciones
1. ⏳ Rediseñar página `Cotizaciones.jsx`
2. ⏳ Mostrar lista de cotizaciones con datos mock
3. ⏳ Agregar botón "Confirmar Cotización"
4. ⏳ Implementar lógica para crear pedido

### Fase 3: Pedidos
1. ⏳ Rediseñar página `Pedidos.jsx`
2. ⏳ Mostrar lista de pedidos
3. ⏳ Agregar botones de acción (Remitir, Facturar, Cobrar)

### Fase 4: Stock
1. ⏳ Rediseñar página `Stock.jsx`
2. ⏳ Implementar vista de balance
3. ⏳ Agregar formularios de ingreso/egreso

### Fase 5: Comprobantes
1. ⏳ Rediseñar página `Comprobantes.jsx`
2. ⏳ Mostrar facturas con preview
3. ⏳ Generar PDF simulado

### Fase 6: Cuenta Corriente
1. ⏳ Rediseñar página `CuentaCorriente.jsx`
2. ⏳ Mostrar movimientos por cliente
3. ⏳ Calcular saldos

## 🔗 Integración con N8N

El sistema está preparado para conectarse con N8N para:
- Generar facturas AFIP reales
- Crear remitos automáticos
- Enviar notificaciones
- Sincronizar con sistemas externos

---

**Creado:** 2026-02-08  
**Estado:** Datos Mock Completos ✅  
**Siguiente:** Implementar UI de Oportunidades con botón "Ganado"
