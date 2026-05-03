import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PaidRoute from "@/components/PaidRoute";
import Root from "./pages/Root";
import Index from "./pages/Index";
import ToolsHub from "./pages/ToolsHub";
import ToolTemplate from "./pages/ToolTemplate";
import Resources from "./pages/Resources";
import ResourceArticle from "./pages/ResourceArticle";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/app/Dashboard";
import Pricing from "./pages/Pricing";
import Account from "./pages/Account";
import BillingSuccess from "./pages/BillingSuccess";

const queryClient = new QueryClient();

const RedirectWithSlug = ({ to }: { to: (slug: string) => string }) => {
  const { slug } = useParams();
  return <Navigate to={to(slug || "")} replace />;
};

const RESERVED_ROOT = new Set([
  "resources", "tools", "about", "blog", "privacy", "terms", "",
  "login", "signup", "forgot-password", "reset-password",
  "app", "dashboard", "account", "pricing", "billing",
]);

const LegacySlugRedirect = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+/, "").split("/")[0];
  if (!slug || RESERVED_ROOT.has(slug)) return <NotFound />;
  return <Navigate to={`/resources/${slug}`} replace />;
};

const App = () => (
  <HelmetProvider>
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

              {/* Public marketing/billing */}
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/billing/success" element={<ProtectedRoute><BillingSuccess /></ProtectedRoute>} />

              {/* Authenticated (any plan) */}
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

              {/* Paid-only app */}
              <Route path="/dashboard" element={<PaidRoute><Dashboard /></PaidRoute>} />
              <Route path="/app" element={<Navigate to="/dashboard" replace />} />

              {/* Resources content */}
              <Route path="/resources" element={<Resources />} />
              <Route path="/resources/home" element={<Index />} />
              <Route path="/resources/about" element={<About />} />
              <Route path="/resources/blog" element={<Blog />} />
              <Route path="/resources/privacy" element={<Privacy />} />
              <Route path="/resources/terms" element={<Terms />} />
              <Route path="/resources/:slug" element={<ResourceArticle />} />

              {/* Tools (canonical) */}
              <Route path="/tools" element={<ToolsHub />} />
              <Route path="/tools/:slug" element={<ToolTemplate />} />

              {/* Root: dashboard for signed-in, marketing for guests */}
              <Route path="/" element={<Root />} />

              {/* Legacy redirects */}
              <Route path="/resources/tools" element={<Navigate to="/tools" replace />} />
              <Route path="/resources/tools/:slug" element={<RedirectWithSlug to={(s) => `/tools/${s}`} />} />
              <Route path="/about" element={<Navigate to="/resources/about" replace />} />
              <Route path="/blog" element={<Navigate to="/resources/blog" replace />} />
              <Route path="/privacy" element={<Navigate to="/resources/privacy" replace />} />
              <Route path="/privacy-policy" element={<Navigate to="/resources/privacy" replace />} />
              <Route path="/terms" element={<Navigate to="/resources/terms" replace />} />
              <Route path="/terms-of-service" element={<Navigate to="/resources/terms" replace />} />

              <Route path="/:slug" element={<LegacySlugRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
