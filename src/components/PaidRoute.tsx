import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { FullscreenSpinner } from "@/components/ui/spinner";
import { isGrowthPlanIdentifier } from "@/lib/plans";

interface PaidRouteProps {
  children: JSX.Element;
  /** Plans allowed to access this route. If omitted, any active sub passes. */
  allowedPlans?: string[];
  requireGrowth?: boolean;
}

const PaidRoute = ({ children, allowedPlans, requireGrowth = false }: PaidRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { active, planIdentifier, loading: subLoading } = useSubscription();
  const location = useLocation();

  if (authLoading || subLoading) return <FullscreenSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!active) return <Navigate to="/pricing" replace />;
  if (requireGrowth) {
    if (!isGrowthPlanIdentifier(planIdentifier)) return <Navigate to="/pricing?upgrade=growth" replace />;
  } else if (allowedPlans && allowedPlans.length > 0) {
    const ok = planIdentifier && allowedPlans.includes(planIdentifier);
    if (!ok) return <Navigate to="/pricing?upgrade=growth" replace />;
  }
  return children;
};

export default PaidRoute;
