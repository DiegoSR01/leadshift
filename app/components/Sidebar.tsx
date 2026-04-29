import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  User,
  ChevronLeft,
  ChevronRight,
  Zap,
  Users,
  Mic,
  PenTool,
  Trophy,
  LogOut,
  Star,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/app',
  },
  {
    label: 'Módulos',
    icon: BookOpen,
    href: '/app/modules',
  },
  {
    label: 'Liderazgo',
    icon: Users,
    href: '/app/modules/leadership',
    sub: true,
  },
  {
    label: 'Com. Oral',
    icon: Mic,
    href: '/app/modules/oral',
    sub: true,
  },
  {
    label: 'Com. Escrita',
    icon: PenTool,
    href: '/app/modules/written',
    sub: true,
  },
  {
    label: 'Progreso',
    icon: TrendingUp,
    href: '/app/progress',
  },
  {
    label: 'Resultados',
    icon: Trophy,
    href: '/app/results',
  },
  {
    label: 'Perfil',
    icon: User,
    href: '/app/profile',
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (href: string) => {
    if (href === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className="flex flex-col h-full bg-slate-900 text-white transition-all duration-300 relative flex-shrink-0"
      style={{ width: collapsed ? '72px' : '240px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-white font-bold text-lg tracking-tight">LeadShift</span>
            <div className="text-slate-400 text-xs">Skills Platform</div>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 hover:scale-110 active:scale-95 transition-all duration-200 z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* User XP badge */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-2 bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-slate-300">Nivel 4 · Líder en Formación</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-blue-500 to-violet-500 h-1.5 rounded-full" style={{ width: '65%' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-slate-400 text-xs">1,240 XP</span>
            <span className="text-slate-400 text-xs">1,900 XP</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]
                ${item.sub ? 'ml-2' : ''}
                ${active
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon className={`flex-shrink-0 ${item.sub ? 'w-4 h-4' : 'w-5 h-5'}`} />
              {!collapsed && (
                <span className={`truncate ${item.sub ? 'text-sm' : 'text-sm font-medium'}`}>
                  {item.label}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 border-t border-slate-800 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
