import { Outlet, Navigate } from 'react-router';
import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function AppLayout() {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="text-slate-400">Cargando...</div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '0' : '0' }}
      >
        <Outlet />
      </main>
    </div>
  );
}
