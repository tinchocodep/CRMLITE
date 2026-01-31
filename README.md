# SAILO CRM Lite 🚀

Sistema de CRM moderno y responsive para gestión de prospectos, clientes y contactos.

## 🌟 Características

- ✅ **Sistema de Login Completo** con autenticación mock
- ✅ **Dashboard Interactivo** con métricas en tiempo real
- ✅ **Gestión de Prospectos** con clasificación por temperatura
- ✅ **Gestión de Clientes** con historial completo
- ✅ **Agenda Integrada** con vistas diaria y semanal
- ✅ **Modo Oscuro** automático y manual
- ✅ **Diseño Responsive** optimizado para móvil y desktop
- ✅ **Redirección Inteligente** según dispositivo

## 🔐 Credenciales de Demo

**Modo**: Autenticación Mock (Demo)

Cualquier credencial funciona, solo sigue estas reglas:
- **Email**: Formato válido (ej: `admin@sailo.com`)
- **Password**: Mínimo 6 caracteres (ej: `123456`)

## 🚀 Despliegue Rápido

### Opción 1: Vercel (Recomendado)

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importa este repositorio: `tinchocodep/CRMLITE`
4. Vercel detectará automáticamente Vite
5. Click en "Deploy"
6. ¡Listo! Tu app estará en línea en segundos

**Configuración automática de Vercel**:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Opción 2: Netlify

1. Ve a [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arrastra la carpeta `dist/` (ya generada)
3. ¡Listo!

O desde GitHub:
1. Ve a [netlify.com](https://netlify.com)
2. Click en "Add new site" → "Import an existing project"
3. Conecta con GitHub y selecciona `tinchocodep/CRMLITE`
4. Netlify detectará la configuración de `netlify.toml`
5. Click en "Deploy"

## 💻 Desarrollo Local

### Requisitos
- Node.js 20.19+ o 22.12+ (recomendado)
- npm 10+

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tinchocodep/CRMLITE.git
cd CRMLITE

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 8000)
npm run dev
```

La aplicación estará disponible en:
- **Desktop**: http://localhost:8000
- **Mobile**: http://[tu-ip-local]:8000

### Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo (puerto 8000)
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter de código
```

## 📱 Redirección por Dispositivo

El sistema detecta automáticamente el tipo de dispositivo:

- **Mobile** → Redirige a `/dashboard`
- **Desktop** → Redirige a `/ficha-360`

## 🏗️ Tecnologías

- **React 18** - Framework UI
- **Vite** - Build tool ultra-rápido
- **Tailwind CSS** - Estilos utility-first
- **React Router** - Navegación SPA
- **Framer Motion** - Animaciones fluidas
- **Three.js** - Logo 3D interactivo
- **Lucide React** - Iconos modernos
- **date-fns** - Manejo de fechas

## 📂 Estructura del Proyecto

```
blazing-star/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── contexts/        # Context API (Auth, Theme)
│   ├── data/           # Mock data
│   ├── layouts/        # Layouts principales
│   ├── pages/          # Páginas de la app
│   ├── App.jsx         # Configuración de rutas
│   └── main.jsx        # Entry point
├── public/             # Assets estáticos
├── dist/              # Build de producción
└── package.json       # Dependencias
```

## 🎨 Módulos Principales

1. **Dashboard** - Vista general con métricas
2. **Prospectos** - Gestión de leads con temperatura
3. **Clientes** - Base de datos de clientes
4. **Contactos** - Directorio de contactos
5. **Agenda** - Calendario de eventos
6. **Legajo** - Documentación de clientes
7. **Configuración** - Tema y preferencias

## 🔒 Autenticación

El sistema incluye:
- Login con validación de formularios
- Sesión persistente con localStorage
- Rutas protegidas
- Logout desde Dashboard y Settings
- Redirección automática según autenticación

## 🌙 Modo Oscuro

Tres modos disponibles:
- **Claro** - Tema light
- **Oscuro** - Tema dark
- **Auto** - Cambia según hora (20:00-06:00 = oscuro)

## 📦 Build de Producción

```bash
npm run build
```

Genera la carpeta `dist/` lista para deploy:
- HTML minificado
- CSS optimizado (~116 KB)
- JS bundle (~1.5 MB)
- Assets optimizados

## 🔧 Configuración de Vercel

El proyecto incluye configuración automática. Vercel detectará:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Variables de Entorno (Opcional)

Si en el futuro necesitas variables de entorno:

```bash
# En Vercel Dashboard → Settings → Environment Variables
VITE_API_URL=https://api.tudominio.com
```

## 📱 Acceso desde Mobile

Para probar en tu móvil durante desarrollo:

1. Asegúrate de estar en la misma red WiFi
2. Encuentra tu IP local:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```
3. Accede desde el móvil: `http://[tu-ip]:8000`

## 🐛 Troubleshooting

### Error de Node.js Version
```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node 20
nvm install 20
nvm use 20
```

### Puerto 8000 ocupado
Edita `vite.config.js` y cambia el puerto:
```js
server: {
  port: 3000, // Cambia aquí
  host: true
}
```

## 📄 Licencia

Proyecto privado - SAILO CRM Lite

## 👨‍💻 Autor

Desarrollado para NEURACALL

---

**¿Necesitas ayuda?** Revisa la documentación en la carpeta del proyecto o contacta al equipo de desarrollo.
