# Diagrama Entidad-Relación — CRM

> Schema real · Supabase CRM-Demo · Febrero 2026

---

## Vista General de Dominios

```mermaid
graph TD
    A["🏢 PLATAFORMA\n─────────────\ntenants\ntenant_modules"]
    B["👥 EQUIPO COMERCIAL\n─────────────\nusers\ncomercialesrcialeserciales"]
    C["🤝 CRM CORE\n─────────────\ncompanies\ncontacts\nopportunities\nactivities · events"]
    D["💰 PIPELINE DE VENTAS\n─────────────\nquotations\norders\ncomprobantes"]
    E["🌾 TERRITORIO\n─────────────\nestablishments\nlots · segments"]
    F["🔔 SISTEMA\n─────────────\nnotifications\nfile_attachments"]

    A -->|"multitenancy"| B
    A -->|"multitenancy"| C
    A -->|"multitenancy"| D
    A -->|"multitenancy"| E
    B -->|"gestiona"| C
    B -->|"emite"| D
    C -->|"convierte"| D
    C -->|"tiene"| E
    C --- F
```

---

## 1 · Plataforma Multi-Tenant

```mermaid
erDiagram
    TENANTS {
        bigint id PK
        text name
        text domain UK
        boolean is_active
        boolean is_system
        text logo_url
        text primary_color
        text primary_hover
        text accent_color
    }
    TENANT_MODULES {
        bigint id PK
        bigint tenant_id FK
        text module_key
        boolean is_enabled
    }
    TENANTS ||--o{ TENANT_MODULES : "habilita módulos"
```

---

## 2 · Equipo Comercial

```mermaid
erDiagram
    TENANTS {
        bigint id PK
        text name
    }
    USERS {
        uuid id PK
        text email
        text full_name
        text role
        bigint tenant_id FK
        uuid comercial_id FK
        uuid supervisor_id FK
    }
    COMERCIALES {
        uuid id PK
        text name
        text ROL
        text region
        uuid user_id FK
        bigint tenant_id FK
        uuid supervisor_id FK
        uuid gerente_zona_id FK
    }

    TENANTS ||--o{ USERS : "pertenece a"
    TENANTS ||--o{ COMERCIALES : "pertenece a"
    USERS ||--o| COMERCIALES : "vinculado a"
    COMERCIALES ||--o{ COMERCIALES : "supervisa"
```

> **Jerarquía de roles:** `super_admin` → `admin` → `gerente_zona` → `supervisor` → `user`

---

## 3 · CRM Core

```mermaid
erDiagram
    COMPANIES {
        bigint id PK
        text company_type
        text legal_name
        text cuit UK
        text city
        text province
        integer qualification_score
        text importance
        text status
        date client_since
        numeric credit_limit
        uuid comercial_id FK
        bigint tenant_id FK
    }
    CONTACTS {
        bigint id PK
        text first_name
        text last_name
        text email
        text phone
        text mobile
        uuid comercial_id FK
        bigint tenant_id FK
    }
    CONTACT_COMPANIES {
        bigint id PK
        bigint contact_id FK
        bigint company_id FK
        boolean is_primary
        text role
    }
    OPPORTUNITIES {
        bigint id PK
        text opportunity_name
        numeric amount
        text status
        integer probability
        date close_date
        bigint company_id FK
        bigint contact_id FK
        uuid comercial_id FK
    }
    ACTIVITIES {
        bigint id PK
        text title
        text activity_type
        text priority
        text status
        date scheduled_date
        bigint company_id FK
        bigint contact_id FK
        bigint opportunity_id FK
    }
    EVENTS {
        bigint id PK
        text title
        date event_date
        text location
        bigint company_id FK
        bigint contact_id FK
    }

    COMPANIES ||--o{ CONTACT_COMPANIES : "tiene contactos"
    CONTACTS ||--o{ CONTACT_COMPANIES : "vinculado a"
    COMPANIES ||--o{ OPPORTUNITIES : "genera"
    CONTACTS ||--o{ OPPORTUNITIES : "participa"
    OPPORTUNITIES ||--o{ ACTIVITIES : "tiene"
    COMPANIES ||--o{ ACTIVITIES : "tiene"
    COMPANIES ||--o{ EVENTS : "tiene"
```

> `company_type` = **'prospect'** o **'client'** — misma tabla, mismo registro, solo cambia el campo al convertir.

---

## 4 · Pipeline de Ventas

```mermaid
erDiagram
    OPPORTUNITIES {
        bigint id PK
        text opportunity_name
        text status
    }
    QUOTATIONS {
        bigint id PK
        varchar quotation_number
        text status
        numeric subtotal
        numeric tax
        numeric total
        numeric tax_rate
        date delivery_date
        bigint opportunity_id FK
        bigint company_id FK
        uuid comercial_id FK
    }
    QUOTATION_LINES {
        bigint id PK
        bigint quotation_id FK
        varchar product_name
        varchar product_sap_code
        numeric quantity
        numeric unit_price
        numeric total
    }
    ORDERS {
        bigint id PK
        varchar order_number UK
        text status
        numeric total
        date delivery_date
        bigint quotation_id FK
        bigint company_id FK
        uuid comercial_id FK
    }
    ORDER_LINES {
        bigint id PK
        bigint order_id FK
        varchar product_name
        numeric quantity
        numeric unit_price
        numeric total
        text product_source
    }
    COMPROBANTES {
        uuid id PK
        text tipo
        text letra
        integer punto_venta
        text cae
        text pdf_url
        numeric total
        boolean is_partial_payment
        numeric remaining_balance
        date fecha_emision
        bigint order_id FK
    }

    OPPORTUNITIES ||--o{ QUOTATIONS : "genera"
    QUOTATIONS ||--o{ QUOTATION_LINES : "ítems"
    QUOTATIONS ||--o| ORDERS : "se convierte en"
    ORDERS ||--o{ ORDER_LINES : "ítems"
    ORDERS ||--o{ COMPROBANTES : "genera"
```

> **Flujo:** Oportunidad → `Cotización` → `Pedido` → `Comprobante` (FACTURA / REMITO / COBRO)

---

## 5 · Territorio Agrícola

```mermaid
erDiagram
    COMPANIES {
        bigint id PK
        text legal_name
        text company_type
    }
    SEGMENTS {
        bigint id PK
        bigint company_id FK
        text name
        numeric hectares
        text crops
        text machinery
    }
    ESTABLISHMENTS {
        uuid id PK
        text name
        text location
        bigint company_id FK
    }
    LOTS {
        uuid id PK
        text name
        uuid establishment_id FK
        bigint prospect_id FK
        bigint client_id FK
        jsonb geometry
        numeric hectares
        text crop_type
        text campaign
        date sowing_date
    }

    COMPANIES ||--o{ SEGMENTS : "tiene segmentos"
    COMPANIES ||--o{ ESTABLISHMENTS : "tiene campos"
    ESTABLISHMENTS ||--o{ LOTS : "contiene lotes"
    COMPANIES ||--o{ LOTS : "lotes asociados"
```

> `geometry` en `lots` almacena polígonos **GeoJSON** para visualización en mapa.

---

## Tabla de Referencia Rápida

| Tabla | Filas aprox. | Descripción |
|---|---|---|
| `tenants` | 6 | Empresas cliente del CRM |
| `tenant_modules` | 44 | Módulos habilitados por tenant |
| `comerciales` | 19 | Representantes comerciales |
| `users` | 12 | Usuarios del sistema |
| `companies` | 1.205 | Prospects y Clientes |
| `contacts` | 13 | Personas de contacto |
| `contact_companies` | 6 | Relación Contacto ↔ Empresa |
| `opportunities` | 6 | Oportunidades de venta |
| `activities` | 9 | Llamadas, reuniones, tareas |
| `quotations` | 5 | Cotizaciones |
| `orders` | 7 | Pedidos confirmados |
| `comprobantes` | 6 | Facturas, remitos, cobros |
| `establishments` | 4 | Campos agrícolas |
| `lots` | 4 | Lotes con GeoJSON |
