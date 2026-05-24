import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'navigator' ? '/nav/home' : '/';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
