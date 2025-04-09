
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mindboost-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
