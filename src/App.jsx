// Cotizador Module - Force Rebuild 2026-02-08
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantBrandingProvider } from './contexts/TenantBrandingContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/shared/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
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
import UserManagement from './pages/UserManagement';
import TeamManagement from './pages/TeamManagement';
import Cotizaciones from './pages/Cotizaciones';
import Pedidos from './pages/Pedidos';
import Comprobantes from './pages/Comprobantes';
import CuentaCorriente from './pages/CuentaCorriente';
import Stock from './pages/Stock';
import CotizadorIndex from './pages/CotizadorIndex';
import ComercialIndex from './pages/ComercialIndex';
import Visitas from './pages/Visitas';
import Campos from './pages/Campos';
import TenantManagerPage from './pages/admin/TenantManagerPage';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { SuperAdminProvider } from './contexts/SuperAdminContext';

// Componente para proteger rutas que requieren autenticación
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-advanta-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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

/** Only renders children if user is super_admin. Otherwise redirects to /dashboard */
function SuperAdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
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
  // Solo módulos sin ruta dedicada → se renderizan como ModulePlaceholder
  const modules = [
    'Ficha 360°', 'Objetivos', 'Reclamos'
  ];

  const slugify = (text) => (text || '').toLowerCase().replace(/°/g, '').replace(/\s+/g, '-');

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
          <Route path="usuarios" element={<UserManagement />} />
          <Route path="equipos" element={<TeamManagement />} />
          <Route path="cotizador" element={<CotizadorIndex />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="comprobantes" element={<Comprobantes />} />
          <Route path="cuenta-corriente" element={<CuentaCorriente />} />
          <Route path="stock" element={<Stock />} />
          <Route path="comercial" element={<ComercialIndex />} />
          <Route path="visitas" element={<Visitas />} />
          <Route path="campos" element={<Campos />} />
          <Route path="territorios" element={<Navigate to="/campos" replace />} />
          <Route path="territorios/*" element={<Navigate to="/campos" replace />} />
          <Route path="admin/tenants" element={<SuperAdminRoute><TenantManagerPage /></SuperAdminRoute>} />
          {modules.map((name) => (
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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SuperAdminProvider>
            <TenantBrandingProvider>
              <ToastProvider>
                <ConfirmProvider>
                  <BrowserRouter>
                    <AppRoutes />
                    <ToastContainer />
                  </BrowserRouter>
                </ConfirmProvider>
              </ToastProvider>
            </TenantBrandingProvider>
          </SuperAdminProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
