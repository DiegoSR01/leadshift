import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Verificando sesión...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
