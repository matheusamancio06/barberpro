import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Scissors,
  Wrench,
  Package,
  CreditCard,
  Calendar,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Home,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function getNavItems(role: string | undefined) {
  if (role === 'admin') {
    return [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { to: '/agendamentos', icon: Calendar, label: 'Agendamentos' },
      { to: '/clientes', icon: Users, label: 'Clientes' },
      { to: '/barbeiros', icon: Scissors, label: 'Barbeiros' },
      { to: '/servicos', icon: Wrench, label: 'Serviços' },
      { to: '/produtos', icon: Package, label: 'Produtos' },
      { to: '/planos', icon: CreditCard, label: 'Planos' },
      { to: '/reservas', icon: ShoppingBag, label: 'Reservas' },
      { to: '/usuarios', icon: ShieldCheck, label: 'Usuários' },
    ];
  }

  if (role === 'barbeiro') {
    return [
      { to: '/barbeiro', icon: Calendar, label: 'Minha Agenda', exact: true },
      { to: '/reservas', icon: ShoppingBag, label: 'Reservas' },
    ];
  }

  if (role === 'cliente') {
    return [
      { to: '/cliente', icon: Home, label: 'Início', exact: true },
      { to: '/cliente/agendamentos', icon: Calendar, label: 'Agendamentos' },
      { to: '/cliente/produtos', icon: Package, label: 'Produtos' },
      { to: '/cliente/planos', icon: CreditCard, label: 'Planos' },
    ];
  }

  return [];
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  barbeiro: 'Barbeiro',
  cliente: 'Cliente',
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { usuario, logout } = useAuth();
  const navItems = getNavItems(usuario?.role);

  return (
    <aside
      className={`w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-screen fixed left-0 top-0 z-30 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <Scissors size={20} className="text-gray-900" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">BarberPro</h1>
            <p className="text-gray-400 text-xs">Sistema de Barbearia</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm">
            {usuario?.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{usuario?.nome}</p>
            <p className="text-gray-400 text-xs truncate">{ROLE_LABELS[usuario?.role || ''] || usuario?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
