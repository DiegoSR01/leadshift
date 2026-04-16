import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { useState } from 'react';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
