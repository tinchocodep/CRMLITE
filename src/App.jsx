import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import ModulePlaceholder from './pages/ModulePlaceholder';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Prospects from './pages/Prospects';
import Clients from './pages/Clients';
import Contacts from './pages/Contacts';
import Legajos from './pages/Legajos';
import Opportunities from './pages/Opportunities';
import Settings from './pages/Settings';

// Componente para proteger rutas que requieren autenticación
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Componente para manejar redirección móvil
function MobileRedirect({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Detectar si es un dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Si es móvil y está en la raíz, redirigir al dashboard
    if (isMobile && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, location]);

  return children;
}

function AppRoutes() {
  const modules = [
    'Ficha 360°', 'Agenda', 'Prospectos', 'Clientes', 'Legajo',
    'Visitas', 'Oportunidades', 'Objetivos', 'Territorios', 'Reclamos'
  ];

  const slugify = (text) => text.toLowerCase().replace(/°/g, '').replace(/\s+/g, '-');

  return (
    <MobileRedirect>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="prospectos" element={<Prospects />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="contactos" element={<Contacts />} />
          <Route path="oportunidades" element={<Opportunities />} />
          <Route path="legajo" element={<Legajos />} />
          <Route path="configuracion" element={<Settings />} />
          {modules.filter(m => m !== 'Agenda' && m !== 'Prospectos' && m !== 'Clientes' && m !== 'Legajo').map((name) => (
            <Route
              key={name}
              path={slugify(name)}
              element={<ModulePlaceholder title={name} />}
            />
          ))}
        </Route>
      </Routes>
    </MobileRedirect>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
