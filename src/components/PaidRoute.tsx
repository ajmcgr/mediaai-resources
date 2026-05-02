import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

const PaidRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading: authLoading } = useAuth();
  const { active, loading: subLoading } = useSubscription();
  const location = useLocation();

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!active) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
};

export default PaidRoute;
