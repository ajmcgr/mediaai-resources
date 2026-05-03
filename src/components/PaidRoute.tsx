import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { FullscreenSpinner } from "@/components/ui/spinner";

const PaidRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading: authLoading } = useAuth();
  const { active, loading: subLoading } = useSubscription();
  const location = useLocation();

  if (authLoading || subLoading) return <FullscreenSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!active) return <Navigate to="/pricing" replace />;
  return children;
};

export default PaidRoute;
