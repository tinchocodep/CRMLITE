# Guía Completa: Duplicación del CRM SAILO Lite

Esta guía te llevará paso a paso por el proceso completo de duplicar el CRM, incluyendo la base de datos, el código frontend, y el despliegue.

---

## 📋 Tabla de Contenidos

1. [Preparación Inicial](#1-preparación-inicial)
2. [Duplicación de la Base de Datos (Supabase)](#2-duplicación-de-la-base-de-datos-supabase)
3. [Duplicación del Código Frontend](#3-duplicación-del-código-frontend)
4. [Configuración del Nuevo Proyecto](#4-configuración-del-nuevo-proyecto)
5. [Configuración de Webhooks N8N](#5-configuración-de-webhooks-n8n)
6. [Despliegue](#6-despliegue)
7. [Verificación Final](#7-verificación-final)

---

## 1. Preparación Inicial

### 1.1 Requisitos Previos

**Software Necesario:**
- Node.js v18+ (recomendado v18.20.8 o v24.13.0)
- Git
- Cuenta en Supabase
- Cuenta en GitHub
- Cuenta en Vercel o Netlify (para despliegue)
- Cuenta en N8N (si usas workflows)

**Activar Node.js (si usas NVM):**
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18
```

### 1.2 Información a Recopilar del Proyecto Original

Antes de empezar, necesitas tener a mano:

- [ ] URL de Supabase del proyecto original
- [ ] Anon Key de Supabase
- [ ] Service Role Key de Supabase (para migraciones)
- [ ] URLs de webhooks N8N
- [ ] Repositorio GitHub del proyecto original
- [ ] Variables de entorno del proyecto original (archivo `.env`)

---

## 2. Duplicación de la Base de Datos (Supabase)

### 2.1 Crear Nuevo Proyecto en Supabase

1. **Accede a Supabase Dashboard:**
   - Ve a https://supabase.com/dashboard
   - Click en "New Project"

2. **Configuración del Proyecto:**
   ```
   Nombre: SAILO-CRM-[NOMBRE-CLIENTE]
   Database Password: [Genera una contraseña segura]
   Región: Selecciona la más cercana a tus usuarios
   Plan: Free o Pro (según necesidades)
   ```

3. **Espera a que el proyecto se inicialice** (2-5 minutos)

4. **Guarda las credenciales:**
   - Ve a Settings → API
   - Copia: `Project URL` y `anon public` key
   - Ve a Settings → Database → Connection string
   - Copia la connection string

### 2.2 Aplicar el Schema de Base de Datos

**Opción A: Desde el SQL Editor de Supabase (Recomendado)**

1. En el nuevo proyecto, ve a **SQL Editor**
2. Crea un nuevo query
3. Copia y pega el contenido del archivo de migración principal

**Archivos de migración a aplicar en orden:**

```bash
# En tu proyecto local, revisa estos archivos:
/Users/martin/Documents/NEURACALL/CRM LITE/blazing-star/migrations/
```

Los archivos principales son:
- `01_initial_schema.sql` (o el archivo base de schema)
- `02_rls_policies.sql` (políticas de seguridad)
- `03_functions.sql` (funciones auxiliares)
- Cualquier migración adicional en orden cronológico

4. **Ejecuta cada migración en orden** haciendo click en "Run"

**Opción B: Usando el Script de Migración**

```bash
cd /Users/martin/Documents/NEURACALL/CRM\ LITE/blazing-star

# Edita apply-migration.mjs y actualiza las credenciales
# Luego ejecuta:
node apply-migration.mjs
```

### 2.3 Verificar el Schema

```sql
-- Ejecuta en SQL Editor para verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deberías ver:
-- activities
-- comerciales
-- companies
-- contact_companies
-- contacts
-- opportunities
-- supervisor_comerciales
-- users
-- etc.
```

### 2.4 Configurar RLS (Row Level Security)

Las políticas RLS ya deberían estar aplicadas con las migraciones, pero verifica:

```sql
-- Verifica que RLS esté habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Todas las tablas deben tener rowsecurity = true
```

### 2.5 Crear Usuario Administrador Inicial

```sql
-- 1. Primero crea el usuario en Authentication (UI de Supabase)
-- Ve a Authentication → Users → Add User
-- Email: admin@tuempresa.com
-- Password: [contraseña segura]
-- Copia el UUID generado

-- 2. Luego ejecuta este SQL (reemplaza los valores)
INSERT INTO public.users (
  id,
  email,
  role,
  tenant_id,
  comercial_id
) VALUES (
  '[UUID-DEL-AUTH-USER]',
  'admin@tuempresa.com',
  'admin',
  1,  -- Primer tenant
  NULL  -- Los admins no necesitan comercial_id
);

-- 3. Crea el registro en comerciales si es necesario
INSERT INTO public.comerciales (
  nombre,
  email,
  tenant_id,
  user_id
) VALUES (
  'Administrador',
  'admin@tuempresa.com',
  1,
  '[UUID-DEL-AUTH-USER]'
);
```

---

## 3. Duplicación del Código Frontend

### 3.1 Clonar el Repositorio

**Opción A: Desde GitHub (si ya está en GitHub)**

```bash
# Navega a donde quieres crear el nuevo proyecto
cd ~/Documents/NEURACALL/CRM\ LITE/

# Clona el repositorio
git clone https://github.com/tinchocodep/CRMLITE.git nuevo-crm-cliente

cd nuevo-crm-cliente

# Instala dependencias
npm install
```

**Opción B: Copiar el Proyecto Local**

```bash
# Copia el directorio completo
cp -R "/Users/martin/Documents/NEURACALL/CRM LITE/blazing-star" \
      "/Users/martin/Documents/NEURACALL/CRM LITE/nuevo-crm-cliente"

cd "/Users/martin/Documents/NEURACALL/CRM LITE/nuevo-crm-cliente"

# Limpia archivos innecesarios
rm -rf node_modules dist .git

# Instala dependencias frescas
npm install
```

### 3.2 Limpiar Datos del Proyecto Anterior

```bash
# Elimina datos de build anteriores
rm -rf dist
rm -rf node_modules/.vite

# Elimina el repositorio git anterior
rm -rf .git

# Inicializa un nuevo repositorio
git init
git add .
git commit -m "Initial commit: CRM duplicado para [NOMBRE-CLIENTE]"
```

---

## 4. Configuración del Nuevo Proyecto

### 4.1 Actualizar Variables de Entorno

Crea/edita el archivo `.env`:

```bash
# Copia el template
cp .env.example .env

# Edita con tus nuevas credenciales
nano .env
```

**Contenido del `.env`:**

```env
# Supabase Configuration (NUEVO PROYECTO)
VITE_SUPABASE_URL=https://[tu-proyecto-id].supabase.co
VITE_SUPABASE_ANON_KEY=[tu-anon-key]

# N8N Webhooks (puedes usar los mismos o crear nuevos)
VITE_INVOICE_WEBHOOK_URL=https://n8n.neuracall.net/webhook/NeuraUSUARIOPRUEBA
VITE_N8N_COST_INVOICE_UPLOAD=https://n8n.neuracall.net/webhook/LecturaDeInvoice

# Service Role (solo para scripts de migración, NO incluir en producción)
SERVICE_ROLE_KEY=[tu-service-role-key]
```

⚠️ **IMPORTANTE:** 
- Nunca commitees el archivo `.env` a Git
- Verifica que `.env` esté en `.gitignore`

### 4.2 Actualizar Información de Branding (Opcional)

Si quieres personalizar para el cliente:

**Logo:**
```bash
# Reemplaza el logo
cp /ruta/al/nuevo/logo.png public/logo.png
```

**Título y Metadata:**
```html
<!-- index.html -->
<title>SAILO CRM - [Nombre Cliente]</title>
<meta name="description" content="CRM personalizado para [Nombre Cliente]">
```

**Colores de Marca (opcional):**
```css
/* src/index.css - Variables CSS */
:root {
  --primary-color: #tu-color-primario;
  --secondary-color: #tu-color-secundario;
}
```

### 4.3 Verificar Configuración Local

```bash
# Activa Node.js
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Inicia el servidor de desarrollo
npm run dev

# Debería abrir en http://localhost:5173 o http://localhost:8000
```

**Pruebas Iniciales:**
1. ✅ La aplicación carga sin errores
2. ✅ Puedes hacer login con el usuario admin creado
3. ✅ El dashboard muestra correctamente
4. ✅ No hay errores en la consola del navegador

---

## 5. Configuración de Webhooks N8N

### 5.1 Opción A: Reutilizar Webhooks Existentes

Si el cliente compartirá la misma instancia N8N:
- Mantén las mismas URLs en el `.env`
- Asegúrate de que los workflows N8N puedan distinguir entre tenants

### 5.2 Opción B: Crear Nuevos Webhooks

Si el cliente necesita webhooks dedicados:

1. **Accede a N8N:**
   - Ve a https://n8n.neuracall.net

2. **Duplica los Workflows:**
   - Busca los workflows: "LecturaDeInvoice", "NeuraUSUARIOPRUEBA"
   - Duplica cada uno
   - Renombra: "LecturaDeInvoice-[CLIENTE]"

3. **Actualiza las URLs:**
   - Copia las nuevas URLs de webhook
   - Actualiza el `.env` con las nuevas URLs

4. **Configura Credenciales:**
   - Actualiza las credenciales de Supabase en N8N
   - Apunta a tu nuevo proyecto Supabase

---

## 6. Despliegue

### 6.1 Crear Repositorio en GitHub

```bash
# Desde el directorio del proyecto
git remote add origin https://github.com/[tu-usuario]/[nuevo-repo-crm].git

# Primera subida
git branch -M main
git push -u origin main
```

### 6.2 Despliegue en Vercel (Recomendado)

**Paso 1: Conectar Repositorio**

1. Ve a https://vercel.com/dashboard
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. Selecciona el repositorio recién creado

**Paso 2: Configurar Build**

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Paso 3: Variables de Entorno**

En Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL = https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY = [tu-anon-key]
VITE_INVOICE_WEBHOOK_URL = [tu-webhook-url]
VITE_N8N_COST_INVOICE_UPLOAD = [tu-webhook-url]
```

**Paso 4: Deploy**

- Click en "Deploy"
- Espera 2-3 minutos
- Vercel te dará una URL: `https://[tu-proyecto].vercel.app`

### 6.3 Despliegue en Netlify (Alternativa)

**Paso 1: Conectar Repositorio**

1. Ve a https://app.netlify.com
2. Click en "Add new site" → "Import an existing project"
3. Conecta con GitHub y selecciona tu repositorio

**Paso 2: Configurar Build**

```
Build command: npm run build
Publish directory: dist
```

**Paso 3: Variables de Entorno**

Site settings → Environment variables → Add variables:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_INVOICE_WEBHOOK_URL
VITE_N8N_COST_INVOICE_UPLOAD
```

**Paso 4: Deploy**

- Click en "Deploy site"
- Netlify te dará una URL: `https://[random-name].netlify.app`

### 6.4 Configurar Dominio Personalizado (Opcional)

**En Vercel:**
1. Settings → Domains
2. Add Domain
3. Sigue las instrucciones para configurar DNS

**En Netlify:**
1. Domain settings → Add custom domain
2. Configura los registros DNS según indicaciones

---

## 7. Verificación Final

### 7.1 Checklist de Verificación

**Base de Datos:**
- [ ] Todas las tablas creadas correctamente
- [ ] RLS habilitado en todas las tablas
- [ ] Usuario administrador puede hacer login
- [ ] Políticas de seguridad funcionando

**Frontend:**
- [ ] Aplicación carga sin errores
- [ ] Login funciona correctamente
- [ ] Dashboard muestra datos
- [ ] Navegación entre módulos funciona
- [ ] No hay errores en consola

**Funcionalidades Core:**
- [ ] Crear/Editar/Eliminar Clientes
- [ ] Crear/Editar/Eliminar Contactos
- [ ] Crear/Editar/Eliminar Oportunidades
- [ ] Agenda funciona correctamente
- [ ] Usuarios y Comerciales se gestionan bien

**Integraciones:**
- [ ] Webhooks N8N responden correctamente
- [ ] Carga de facturas funciona
- [ ] Procesamiento de costos funciona

**Seguridad:**
- [ ] Variables de entorno NO están en el código
- [ ] RLS previene acceso no autorizado
- [ ] Roles (Admin/Supervisor/User) funcionan correctamente
- [ ] Multi-tenant isolation funciona

### 7.2 Pruebas de Roles

**Crear usuarios de prueba:**

```sql
-- Usuario Comercial
INSERT INTO public.users (id, email, role, tenant_id, comercial_id)
VALUES ('[uuid]', 'comercial@test.com', 'user', 1, [comercial_id]);

-- Usuario Supervisor
INSERT INTO public.users (id, email, role, tenant_id, comercial_id)
VALUES ('[uuid]', 'supervisor@test.com', 'supervisor', 1, [comercial_id]);
```

**Verificar:**
- Admin ve todo
- Supervisor ve su equipo
- Comercial solo ve sus registros

---

## 8. Mantenimiento Post-Duplicación

### 8.1 Actualizaciones del Código

Cuando necesites actualizar el CRM:

```bash
# En el proyecto original
cd /Users/martin/Documents/NEURACALL/CRM\ LITE/blazing-star
git pull origin main

# En el proyecto duplicado
cd /Users/martin/Documents/NEURACALL/CRM\ LITE/nuevo-crm-cliente

# Opción A: Merge manual
git remote add upstream https://github.com/tinchocodep/CRMLITE.git
git fetch upstream
git merge upstream/main

# Opción B: Cherry-pick de commits específicos
git cherry-pick [commit-hash]

# Push a producción
git push origin main
```

### 8.2 Migraciones de Base de Datos

Cuando haya nuevas migraciones:

1. Prueba primero en desarrollo
2. Aplica en producción usando SQL Editor
3. Documenta la migración

### 8.3 Backup

**Base de Datos:**
- Supabase hace backups automáticos (plan Pro)
- Exporta manualmente: Dashboard → Database → Backups

**Código:**
- GitHub mantiene todo el historial
- Haz tags de versiones estables: `git tag v1.0.0`

---

## 9. Solución de Problemas Comunes

### Error: "Failed to fetch" al hacer login

**Causa:** URL de Supabase incorrecta o CORS
**Solución:**
```bash
# Verifica .env
cat .env | grep VITE_SUPABASE_URL

# Debe coincidir con tu proyecto en Supabase
```

### Error: "Row violates RLS policy"

**Causa:** Políticas RLS mal configuradas
**Solución:**
```sql
-- Verifica políticas
SELECT * FROM pg_policies WHERE tablename = 'companies';

-- Reaplica migraciones RLS
```

### Build falla en Vercel/Netlify

**Causa:** Variables de entorno faltantes
**Solución:**
1. Verifica que todas las variables estén configuradas
2. Redeploy: `git commit --allow-empty -m "trigger" && git push`

### White Screen of Death (WSoD)

**Causa:** Error de JavaScript no capturado
**Solución:**
```bash
# Build local para ver errores
npm run build
npm run preview

# Revisa consola del navegador
```

---

## 10. Recursos Adicionales

### Documentación del Proyecto

- `README.md` - Información general
- `BUILD_COMPLETADO.md` - Guía de build
- `DEPLOY_RAPIDO.md` - Deploy rápido
- `VERCEL_DEPLOY.md` - Deploy en Vercel
- `NETLIFY_DEPLOY.md` - Deploy en Netlify

### Arquitectura

- `/Users/martin/.gemini/antigravity/knowledge/neuracall_project/artifacts/`
  - `implementation/master_architecture.md` - Arquitectura completa
  - `deployment.md` - Patrones de deployment
  - `troubleshooting/troubleshooting_guide.md` - Guía de troubleshooting

### Contacto y Soporte

- Repositorio: https://github.com/tinchocodep/CRMLITE
- Issues: https://github.com/tinchocodep/CRMLITE/issues

---

## 📝 Notas Finales

- **Tiempo estimado:** 2-4 horas para duplicación completa
- **Nivel de dificultad:** Intermedio
- **Requisitos técnicos:** Conocimientos de Git, SQL básico, y deployment

**¡Éxito con tu nueva instancia del CRM!** 🚀
