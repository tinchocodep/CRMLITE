# Especificación Funcional - Módulo Cotizador Advanta CRM

## 📋 Resumen Ejecutivo

Sistema integral de gestión comercial que conecta el CRM con la operación logística y financiera, desde la oportunidad hasta el cobro.

---

## 🔄 Flujo General del Proceso

```
Oportunidad (CRM) 
    ↓
Cotización 
    ↓
Cotización Confirmada (Pedido)
    ↓
    ├─→ Remitir (Stock Egreso)
    ├─→ Facturar (Comprobantes)
    └─→ Cobrar (Pagos → Cuenta Corriente)
```

---

## 1️⃣ Módulo: Oportunidad (CRM)

**Descripción:** Punto de entrada del proceso comercial. Ya existe en el CRM.

### Datos Requeridos:
- ✅ Datos Básicos del cliente/prospecto (ya existe)
- 🆕 **Tipo de Venta:** 
  - Propia (Advanta vende directamente)
  - Tercerizada/Partner (Advanta intermedia)

### Integración:
- Cuando una oportunidad se **gana**, debe poder convertirse en **Cotización**

---

## 2️⃣ Módulo: Cotización

**Descripción:** Formalización de la oportunidad con detalles técnicos y comerciales.

### Datos Requeridos:

#### Heredados de Oportunidad:
- Cliente/Prospecto
- Tipo de Venta (Propia/Tercerizada)
- Productos/Servicios

#### Datos Ampliados:
- **Condición de Pago:**
  - Contado
  - 30 días
  - 60 días
  - 90 días
  - Personalizado
- **Fecha de Entrega Estimada**
- **Logística:**
  - Origen (dirección de retiro)
  - Destino (dirección de entrega)

#### Detalle de Productos:
- Producto
- Cantidad
- Volumen (m³ o unidad)
- Precio Unitario
- Subtotal
- IVA
- Total

### Estados:
- 📝 Borrador
- 📤 Enviada
- ✅ Aprobada
- ❌ Rechazada
- 🔄 Revisión

### Acciones:
- **Convertir a Pedido** (Cotización Confirmada)

---

## 3️⃣ Módulo: Cotización Confirmada (Pedido)

**Descripción:** Nexo entre venta y operación. Dispara acciones operativas.

### Acciones Disponibles:

#### A. Remitir
- Genera movimiento de **Egreso de Stock**
- Crea **Remito** (comprobante de entrega)

#### B. Facturar
- Genera **Factura** (propia o de tercero)
- Integración con AFIP (si es propia)

#### C. Cobrar
- Registra **Pago**
- Actualiza **Cuenta Corriente**

### Estados del Pedido:
- 🟡 Pendiente
- 📦 Remitido (parcial/total)
- 💰 Facturado (parcial/total)
- ✅ Cobrado (parcial/total)
- 🎯 Completado

---

## 4️⃣ Módulo: Stocks (Inventario)

### A. Ingreso de Stock

#### Datos Generales:
- **Origen:** Proveedor/Ubicación
- **Tipo de Stock:**
  - Propio (de Advanta)
  - Consignado (de terceros)
- **Fecha de Ingreso**

#### Detalle de Carga:
- Producto
- Cantidad
- Volumen (m³)
- Lote (opcional)
- Vencimiento (opcional)

#### Logística de Ingreso:
- **Destino:** Depósito/Almacén
- **Transportista**
- **Chofer**
- **Patente**
- **Remito Proveedor** (número)

### B. Egreso de Stock

#### Datos Generales:
- **Fecha de Remito**
- **Número de Remito** (auto-generado)
- **Pedido Asociado** (heredado)

#### Logística de Salida:
- **Origen:** Depósito (heredado del Pedido)
- **Destino:** Cliente (heredado del Pedido)
- **Transportista**
- **Chofer**
- **Patente**

#### Detalle de Salida:
- Bultos (cantidad de paquetes)
- Producto
- Cantidad
- Lote (si aplica)

### C. Listado de Stock (Consulta)

#### Filtros:
- Tipo: Propio / Consignado
- Producto
- Depósito
- Fecha

#### Columnas:
| Producto | Entradas | Salidas | Saldo Actual | Tipo | Depósito |
|----------|----------|---------|--------------|------|----------|
| Producto A | 100 | 30 | 70 | Propio | Depósito 1 |

---

## 5️⃣ Módulo: Facturas

### A. Facturas Propias (Integración AFIP)

#### Datos Requeridos:
- **Tipo de Comprobante:**
  - Factura A
  - Factura B
  - Factura C
  - Nota de Crédito A/B/C
  - Nota de Débito A/B/C
- **Referencia a Factura Advanta** (si es venta tercerizada)
- **Fecha de Emisión**
- **Condición de Pago** (heredada del Pedido)
- **Punto de Venta**
- **Número de Comprobante** (auto-generado por AFIP)

#### Detalle:
- Producto/Servicio
- Cantidad
- Precio Unitario
- Subtotal
- IVA (21%, 10.5%, 0%)
- Total

#### Generación:
- **HTML:** Vista previa en pantalla
- **PDF:** Descargable con:
  - CAE (Código de Autorización Electrónico)
  - Código QR (validación AFIP)
  - Fecha de vencimiento CAE

### B. Facturas de Terceros (Proforma)

#### Características:
- **Formato:** Idéntico a factura AFIP
- **Sin validez fiscal**
- **Sin QR**
- **Sin CAE**
- **Marca de agua:** "PROFORMA - SIN VALIDEZ FISCAL"

#### Datos:
- Mismos que Factura Propia
- **Referencia:** Factura Advanta (número externo)

---

## 6️⃣ Módulo: Pagos (Tesorería)

### Métodos de Pago:

#### A. Efectivo
- Fecha
- Importe
- Recibo (número auto-generado)

#### B. Cheque
- Fecha de Recepción
- Importe
- Banco
- Número de Cheque
- Fecha de Cobro (diferido)
- Titular

#### C. Transferencia
- Fecha
- Importe
- Banco
- Número de Operación
- CBU/CVU Origen
- Titular

### Funcionalidad:
- **Asignar a Factura(s):** Un pago puede cancelar una o varias facturas
- **Generar Recibo:** PDF con detalle del pago y facturas canceladas

---

## 7️⃣ Módulo: Cuenta Corriente

**Descripción:** Estado financiero consolidado del cliente.

### Filtros:
- Por Cliente
- Por Rango de Fechas
- Por Estado (Pendiente/Pagado)

### Columnas:

| Fecha | Tipo | Número | Débito | Crédito | Saldo | Acciones |
|-------|------|--------|--------|---------|-------|----------|
| 08/02/26 | Factura A | 0001-00000123 | $10,000 | - | $10,000 | [Ver PDF] |
| 09/02/26 | Pago (Transf.) | REC-001 | - | $5,000 | $5,000 | [Ver Recibo] |
| 10/02/26 | Nota Crédito A | 0001-00000045 | - | $1,000 | $4,000 | [Ver PDF] |

### Composición:
- **Débitos (+):**
  - Facturas
  - Notas de Débito
- **Créditos (-):**
  - Pagos
  - Notas de Crédito

### Funcionalidad:
- **Link a Comprobante:** Cada línea tiene botón para ver HTML/PDF
- **Saldo Acumulado:** Cálculo automático
- **Alertas:** Vencimientos próximos, saldos vencidos

---

## 🗄️ Modelo de Datos Propuesto

### Tablas Nuevas:

```sql
-- Cotizaciones
quotations
  - id
  - opportunity_id (FK a opportunities)
  - sale_type (enum: 'own', 'partner')
  - payment_condition (enum: 'cash', '30d', '60d', '90d', 'custom')
  - delivery_date
  - origin_address
  - destination_address
  - status (enum: 'draft', 'sent', 'approved', 'rejected', 'revision')
  - total_amount
  - created_at
  - updated_at

-- Líneas de Cotización
quotation_lines
  - id
  - quotation_id (FK)
  - product_name
  - quantity
  - volume
  - unit_price
  - subtotal
  - tax_rate
  - total

-- Pedidos (Cotizaciones Confirmadas)
orders
  - id
  - quotation_id (FK)
  - order_number (auto)
  - status (enum: 'pending', 'shipped', 'invoiced', 'paid', 'completed')
  - created_at

-- Stock (Inventario)
stock_movements
  - id
  - type (enum: 'in', 'out')
  - stock_type (enum: 'own', 'consigned')
  - order_id (FK, nullable)
  - origin
  - destination
  - transport_company
  - driver_name
  - vehicle_plate
  - movement_date
  - created_at

-- Líneas de Movimiento de Stock
stock_movement_lines
  - id
  - movement_id (FK)
  - product_name
  - quantity
  - volume
  - batch_number
  - expiry_date

-- Facturas
invoices
  - id
  - order_id (FK)
  - invoice_type (enum: 'A', 'B', 'C', 'NC_A', 'NC_B', 'NC_C', 'ND_A', 'ND_B', 'ND_C')
  - is_afip (boolean) -- true = propia, false = proforma
  - partner_invoice_ref (nullable)
  - point_of_sale
  - invoice_number
  - cae (nullable)
  - cae_expiry (nullable)
  - issue_date
  - payment_condition
  - total_amount
  - created_at

-- Líneas de Factura
invoice_lines
  - id
  - invoice_id (FK)
  - product_name
  - quantity
  - unit_price
  - subtotal
  - tax_rate
  - total

-- Pagos
payments
  - id
  - client_id (FK a companies)
  - payment_method (enum: 'cash', 'check', 'transfer')
  - amount
  - payment_date
  - receipt_number (auto)
  - -- Campos específicos por método
  - bank_name (nullable)
  - check_number (nullable)
  - check_due_date (nullable)
  - transfer_operation (nullable)
  - cbu_cvu_origin (nullable)
  - payer_name (nullable)
  - created_at

-- Asignación de Pagos a Facturas
payment_allocations
  - id
  - payment_id (FK)
  - invoice_id (FK)
  - allocated_amount

-- Cuenta Corriente (Vista Calculada)
-- Se genera dinámicamente desde invoices y payments
```

---

## 🎯 Plan de Implementación Sugerido

### Fase 1: Cotizaciones (1-2 semanas)
1. Crear tabla `quotations` y `quotation_lines`
2. Agregar campo `sale_type` a Oportunidades
3. Implementar página de Cotizaciones
4. Botón "Convertir a Cotización" en Oportunidades ganadas

### Fase 2: Pedidos (1 semana)
1. Crear tabla `orders`
2. Implementar página de Pedidos
3. Botón "Confirmar Cotización" → Crear Pedido

### Fase 3: Stock (2 semanas)
1. Crear tablas `stock_movements` y `stock_movement_lines`
2. Implementar Ingreso de Stock
3. Implementar Egreso de Stock (desde Pedido)
4. Implementar Listado de Stock con filtros

### Fase 4: Facturas (2-3 semanas)
1. Crear tablas `invoices` y `invoice_lines`
2. Implementar generación de Facturas Propias
3. Integración con AFIP (Webservice)
4. Generación de PDF con CAE y QR
5. Implementar Facturas Proforma (terceros)

### Fase 5: Pagos (1-2 semanas)
1. Crear tablas `payments` y `payment_allocations`
2. Implementar registro de pagos (3 métodos)
3. Asignación de pagos a facturas
4. Generación de recibos

### Fase 6: Cuenta Corriente (1 semana)
1. Implementar vista consolidada
2. Filtros y búsqueda
3. Links a comprobantes
4. Alertas de vencimientos

---

## 🔧 Tecnologías Requeridas

- **Frontend:** React (ya existe)
- **Backend:** Supabase (ya existe)
- **Integración AFIP:** 
  - Webservice WSFE (Facturación Electrónica)
  - Certificado Digital
  - CUIT de Advanta
- **Generación PDF:** 
  - jsPDF o react-pdf
  - QR Code: qrcode.react
- **Validaciones:** Zod o Yup

---

## 📝 Notas Importantes

1. **Integración AFIP:** Requiere certificado digital y homologación en ambiente de prueba antes de producción
2. **Numeración:** Los números de comprobantes deben ser secuenciales y sin saltos
3. **Auditoría:** Todos los movimientos deben ser trazables (created_by, updated_by)
4. **Permisos:** Definir roles (vendedor, administrador, contador)
5. **Backup:** Sistema crítico, requiere backups automáticos diarios

---

## ✅ Checklist de Validación

- [ ] Oportunidad puede convertirse en Cotización
- [ ] Cotización puede confirmarse como Pedido
- [ ] Pedido puede generar Remito (Egreso Stock)
- [ ] Pedido puede generar Factura (Propia o Proforma)
- [ ] Factura Propia tiene CAE y QR válidos
- [ ] Pago puede asignarse a una o varias facturas
- [ ] Cuenta Corriente muestra saldo correcto
- [ ] PDFs se generan correctamente
- [ ] Stock se actualiza correctamente con cada movimiento
- [ ] Todos los comprobantes son descargables

---

**Documento creado:** 2026-02-08  
**Versión:** 1.0  
**Autor:** Antigravity AI Assistant
