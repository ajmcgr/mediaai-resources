import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ToolsHub from "./pages/ToolsHub";
import ToolTemplate from "./pages/ToolTemplate";
import Resources from "./pages/Resources";
import ResourceArticle from "./pages/ResourceArticle";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/app/Dashboard";

const queryClient = new QueryClient();

const RedirectWithSlug = ({ to }: { to: (slug: string) => string }) => {
  const { slug } = useParams();
  return <Navigate to={to(slug || "")} replace />;
};

const RESERVED_ROOT = new Set([
  "resources", "tools", "about", "",
  "login", "signup", "forgot-password", "reset-password", "app",
]);

const LegacySlugRedirect = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+/, "").split("/")[0];
  if (!slug || RESERVED_ROOT.has(slug)) return <NotFound />;
  return <Navigate to={`/resources/${slug}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected app */}
            <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Resources content */}
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/home" element={<Index />} />
            <Route path="/resources/tools" element={<ToolsHub />} />
            <Route path="/resources/tools/:slug" element={<ToolTemplate />} />
            <Route path="/resources/about" element={<About />} />
            <Route path="/resources/:slug" element={<ResourceArticle />} />

            {/* Legacy redirects */}
            <Route path="/" element={<Navigate to="/resources" replace />} />
            <Route path="/tools" element={<Navigate to="/resources/tools" replace />} />
            <Route path="/tools/:slug" element={<RedirectWithSlug to={(s) => `/resources/tools/${s}`} />} />
            <Route path="/about" element={<Navigate to="/resources/about" replace />} />

            <Route path="/:slug" element={<LegacySlugRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
