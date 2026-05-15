import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

/**
 * Blocks access to module routes until the user has completed the Pretest.
 * Redirects to /app/pretest if pretestCompleted is false.
 */
export function RequirePretest() {
  const { user } = useAuth();

  if (!user) return null; // RequireAuth above us already guards this

  if (!user.pretestCompleted) {
    return <Navigate to="/app/pretest" replace />;
  }

  return <Outlet />;
}
