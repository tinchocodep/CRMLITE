# 🔗 Configuración de Webhooks N8N para Módulo Cotizador

## 📋 Resumen

Este documento explica cómo configurar los webhooks de N8N para integrar las funcionalidades de **REMITIR**, **FACTURAR** y **COBRAR** en el módulo de Pedidos.

---

## 🎯 Webhooks Necesarios

### 1. **REMITIR** - Generar Remito y Egresar Stock

**Archivo:** `src/pages/Pedidos.jsx`  
**Constante:** `WEBHOOK_URLS.remitir`

**Payload enviado:**
```json
{
  "order": {
    "id": "ord-001",
    "orderNumber": "PED-2026-001",
    "clientId": "1234",
    "clientName": "AGRO BC S.R.L.",
    "lines": [
      {
        "productSapCode": 198000053,
        "productName": "80-63TRE Band 3",
        "quantity": 40,
        "unitPrice": 1550,
        "total": 62000
      }
    ],
    "total": 131285,
    "deliveryDate": "2026-03-10"
  },
  "movements": [
    {
      "id": "mov-out-001",
      "type": "out",
      "productSapCode": 198000053,
      "productName": "80-63TRE Band 3",
      "quantity": 40,
      "orderId": "ord-001",
      "orderNumber": "PED-2026-001",
      "date": "2026-02-08"
    }
  ]
}
```

**Acciones esperadas en N8N:**
1. Generar documento de remito (PDF)
2. Registrar egresos de stock en sistema externo (si aplica)
3. Enviar email al cliente con remito adjunto
4. Actualizar estado en sistema de logística

**Respuesta esperada:**
```json
{
  "success": true,
  "remitoNumber": "REM-2026-001",
  "pdfUrl": "https://storage.example.com/remitos/REM-2026-001.pdf",
  "message": "Remito generado exitosamente"
}
```

---

### 2. **FACTURAR** - Generar Factura AFIP

**Archivo:** `src/pages/Pedidos.jsx`  
**Constante:** `WEBHOOK_URLS.facturar`

**Payload enviado:**
```json
{
  "order": {
    "id": "ord-001",
    "orderNumber": "PED-2026-001",
    "clientId": "1234",
    "clientName": "AGRO BC S.R.L.",
    "clientCuit": "30-12345678-9",
    "lines": [
      {
        "productSapCode": 198000053,
        "productName": "80-63TRE Band 3",
        "quantity": 40,
        "unitPrice": 1550,
        "subtotal": 62000,
        "taxRate": 21,
        "total": 75020
      }
    ],
    "subtotal": 108500,
    "tax": 22785,
    "total": 131285
  },
  "invoice": {
    "id": "inv-001",
    "invoiceNumber": "FC-A-0001-00000001",
    "type": "AFIP",
    "issueDate": "2026-02-08",
    "dueDate": "2026-03-10"
  }
}
```

**Acciones esperadas en N8N:**
1. **Conectar con AFIP** para obtener CAE (Código de Autorización Electrónico)
2. Generar PDF de factura con datos fiscales
3. Enviar factura por email al cliente
4. Registrar en sistema contable
5. Actualizar cuenta corriente del cliente

**Respuesta esperada:**
```json
{
  "success": true,
  "invoiceNumber": "FC-A-0001-00000123",
  "cae": "72345678901234",
  "caeExpiration": "2026-02-18",
  "pdfUrl": "https://storage.example.com/facturas/FC-A-0001-00000123.pdf",
  "afipResponse": {
    "resultado": "A",
    "observaciones": []
  },
  "message": "Factura generada exitosamente"
}
```

---

### 3. **COBRAR** - Registrar Pago

**Archivo:** `src/pages/Pedidos.jsx`  
**Constante:** `WEBHOOK_URLS.cobrar`

**Payload enviado:**
```json
{
  "order": {
    "id": "ord-001",
    "orderNumber": "PED-2026-001",
    "clientId": "1234",
    "clientName": "AGRO BC S.R.L.",
    "total": 131285
  },
  "invoice": {
    "id": "inv-001",
    "invoiceNumber": "FC-A-0001-00000123",
    "total": 131285
  },
  "payment": {
    "id": "pay-001",
    "paymentNumber": "PAG-2026-0001",
    "amount": 131285,
    "method": "cash",
    "paymentDate": "2026-02-08"
  }
}
```

**Acciones esperadas en N8N:**
1. Registrar pago en sistema contable
2. Actualizar cuenta corriente del cliente
3. Generar recibo de pago (PDF)
4. Enviar confirmación por email
5. Actualizar estado de cobranza
6. Notificar a tesorería

**Respuesta esperada:**
```json
{
  "success": true,
  "receiptNumber": "REC-2026-001",
  "pdfUrl": "https://storage.example.com/recibos/REC-2026-001.pdf",
  "accountBalance": 0,
  "message": "Pago registrado exitosamente"
}
```

---

## 🛠️ Cómo Configurar

### Paso 1: Obtener URLs de N8N

1. Crea 3 workflows en N8N:
   - `Cotizador - Remitir Pedido`
   - `Cotizador - Facturar Pedido`
   - `Cotizador - Cobrar Pedido`

2. En cada workflow, agrega un nodo **Webhook** al inicio

3. Copia las URLs generadas (ejemplo):
   ```
   https://n8n.tudominio.com/webhook/cotizador-remitir
   https://n8n.tudominio.com/webhook/cotizador-facturar
   https://n8n.tudominio.com/webhook/cotizador-cobrar
   ```

### Paso 2: Actualizar el Código

Abre el archivo `src/pages/Pedidos.jsx` y busca la constante `WEBHOOK_URLS`:

```javascript
// ANTES (línea ~18)
const WEBHOOK_URLS = {
    remitir: '', // URL para generar remito
    facturar: '', // URL para generar factura AFIP
    cobrar: '' // URL para registrar pago
};

// DESPUÉS
const WEBHOOK_URLS = {
    remitir: 'https://n8n.tudominio.com/webhook/cotizador-remitir',
    facturar: 'https://n8n.tudominio.com/webhook/cotizador-facturar',
    cobrar: 'https://n8n.tudominio.com/webhook/cotizador-cobrar'
};
```

### Paso 3: Descomentar Código de Integración

En cada función (`handleRemitir`, `handleFacturar`, `handleCobrar`), busca los comentarios `// TODO:` y descomenta el código:

**Ejemplo en `handleRemitir`:**
```javascript
// ANTES
// if (WEBHOOK_URLS.remitir) {
//     await fetch(WEBHOOK_URLS.remitir, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ order, movements: newMovements })
//     });
// }

// DESPUÉS
if (WEBHOOK_URLS.remitir) {
    const response = await fetch(WEBHOOK_URLS.remitir, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, movements: newMovements })
    });
    
    const result = await response.json();
    
    if (result.success) {
        console.log('Remito generado:', result.remitoNumber);
        // Actualizar con datos reales del webhook
    }
}
```

### Paso 4: Probar la Integración

1. Marca una oportunidad como "Ganada" → Se crea cotización
2. Confirma la cotización → Se crea pedido
3. En el pedido, haz clic en **REMITIR**
4. Verifica que el webhook de N8N reciba el payload
5. Continúa con **FACTURAR** y **COBRAR**

---

## 📊 Workflows N8N Sugeridos

### Workflow 1: Remitir Pedido

```
[Webhook] → [Validar Datos] → [Generar PDF Remito] → [Guardar en Storage] 
    → [Enviar Email] → [Actualizar Stock] → [Responder]
```

### Workflow 2: Facturar Pedido

```
[Webhook] → [Validar Datos] → [Conectar AFIP] → [Obtener CAE] 
    → [Generar PDF Factura] → [Guardar en Storage] → [Enviar Email] 
    → [Actualizar Contabilidad] → [Responder]
```

### Workflow 3: Cobrar Pedido

```
[Webhook] → [Validar Datos] → [Registrar Pago] → [Generar Recibo PDF] 
    → [Guardar en Storage] → [Actualizar Cuenta Corriente] 
    → [Enviar Email] → [Notificar Tesorería] → [Responder]
```

---

## 🔐 Seguridad

### Recomendaciones:

1. **Autenticación**: Agrega un token de autenticación en los headers:
   ```javascript
   headers: { 
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${process.env.REACT_APP_N8N_TOKEN}`
   }
   ```

2. **Validación**: En N8N, valida que los datos recibidos sean correctos

3. **HTTPS**: Usa siempre HTTPS para las URLs de webhook

4. **Rate Limiting**: Implementa límites de requests en N8N

---

## 📝 Notas Importantes

1. **Mock Data**: Actualmente el sistema funciona con datos mock. Los webhooks son opcionales.

2. **Manejo de Errores**: Implementa try-catch y manejo de errores en los workflows de N8N.

3. **Logs**: Guarda logs de todas las operaciones para debugging.

4. **Rollback**: Implementa mecanismos de rollback en caso de error en AFIP.

---

## ✅ Checklist de Implementación

- [ ] Crear 3 workflows en N8N
- [ ] Obtener URLs de webhooks
- [ ] Actualizar `WEBHOOK_URLS` en el código
- [ ] Descomentar código de integración
- [ ] Probar flujo completo: Oportunidad → Cotización → Pedido → Remitir → Facturar → Cobrar
- [ ] Validar generación de PDFs
- [ ] Verificar integración con AFIP
- [ ] Probar envío de emails
- [ ] Validar actualización de cuenta corriente
- [ ] Documentar errores y casos edge

---

**Fecha:** 2026-02-08  
**Autor:** Antigravity AI  
**Versión:** 1.0
