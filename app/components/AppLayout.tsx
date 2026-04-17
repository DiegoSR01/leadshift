import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { AnimatedOutlet } from './AnimatedOutlet';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 overflow-y-auto transition-all duration-300">
        <AnimatedOutlet className="min-h-full" yOffset={12} />
      </main>
    </div>
  );
}
