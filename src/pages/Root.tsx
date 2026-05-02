import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./Index";

const Root = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return <Index />;
};

export default Root;
