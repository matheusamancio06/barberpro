import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import Clientes from './pages/Clientes';
import Barbeiros from './pages/Barbeiros';
import Servicos from './pages/Servicos';
import Produtos from './pages/Produtos';
import Planos from './pages/Planos';
import Agendamentos from './pages/Agendamentos';
import Usuarios from './pages/admin/Usuarios';
import Reservas from './pages/admin/Reservas';

// Barber pages
import BarbeiroAgenda from './pages/barbeiro/Agenda';

// Client pages
import ClienteDashboard from './pages/cliente/Dashboard';
import ClienteAgendamentos from './pages/cliente/Agendamentos';
import ClienteProdutos from './pages/cliente/Produtos';

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, usuario } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && usuario && !roles.includes(usuario.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { usuario } = useAuth();
  if (usuario?.role === 'cliente') return <Navigate to="/cliente" replace />;
  if (usuario?.role === 'barbeiro') return <Navigate to="/barbeiro" replace />;
  return <Dashboard />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        {/* Home redirect by role */}
        <Route index element={<HomeRedirect />} />

        {/* Admin only */}
        <Route path="clientes" element={<PrivateRoute roles={['admin']}><Clientes /></PrivateRoute>} />
        <Route path="barbeiros" element={<PrivateRoute roles={['admin']}><Barbeiros /></PrivateRoute>} />
        <Route path="servicos" element={<PrivateRoute roles={['admin']}><Servicos /></PrivateRoute>} />
        <Route path="produtos" element={<PrivateRoute roles={['admin']}><Produtos /></PrivateRoute>} />
        <Route path="planos" element={<PrivateRoute roles={['admin']}><Planos /></PrivateRoute>} />
        <Route path="agendamentos" element={<PrivateRoute roles={['admin']}><Agendamentos /></PrivateRoute>} />
        <Route path="usuarios" element={<PrivateRoute roles={['admin']}><Usuarios /></PrivateRoute>} />
        <Route path="reservas" element={<PrivateRoute roles={['admin', 'barbeiro']}><Reservas /></PrivateRoute>} />

        {/* Barber */}
        <Route path="barbeiro" element={<PrivateRoute roles={['barbeiro', 'admin']}><BarbeiroAgenda /></PrivateRoute>} />

        {/* Client */}
        <Route path="cliente" element={<PrivateRoute roles={['cliente']}><ClienteDashboard /></PrivateRoute>} />
        <Route path="cliente/agendamentos" element={<PrivateRoute roles={['cliente']}><ClienteAgendamentos /></PrivateRoute>} />
        <Route path="cliente/produtos" element={<PrivateRoute roles={['cliente']}><ClienteProdutos /></PrivateRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
