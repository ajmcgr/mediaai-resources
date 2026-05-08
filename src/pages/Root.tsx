import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullscreenSpinner } from "@/components/ui/spinner";
import Index from "./Index";

const Root = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullscreenSpinner />;
  if (user) return <Navigate to="/chat" replace />;

  return <Index />;
};

export default Root;
