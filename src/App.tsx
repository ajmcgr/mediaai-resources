import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PaidRoute from "@/components/PaidRoute";
import RecoveryRedirect from "@/components/RecoveryRedirect";
import Root from "./pages/Root";
import Index from "./pages/Index";
import ToolsHub from "./pages/ToolsHub";
import ToolTemplate from "./pages/ToolTemplate";
import Resources from "./pages/Resources";
import ResourceArticle from "./pages/ResourceArticle";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/app/Dashboard";
import Chat from "./pages/app/Chat";
import Monitor from "./pages/app/Monitor";
import Pricing from "./pages/Pricing";
import Account from "./pages/Account";
import BillingSuccess from "./pages/BillingSuccess";
import RequestDemo from "./pages/RequestDemo";

const queryClient = new QueryClient();

const RedirectWithSlug = ({ to }: { to: (slug: string) => string }) => {
  const { slug } = useParams();
  return <Navigate to={to(slug || "")} replace />;
};

const RESERVED_ROOT = new Set([
  "resources", "tools", "about", "blog", "privacy", "terms", "",
  "login", "signup", "forgot-password", "reset-password",
  "app", "dashboard", "database", "chat", "monitor", "account", "pricing", "billing", "request-demo",
]);

const LegacySlugRedirect = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+/, "").split("/")[0];
  if (!slug || RESERVED_ROOT.has(slug)) return <NotFound />;
  return <Navigate to={`/resources/${slug}`} replace />;
};

const TopupSuccessRedirect = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set("topup", "success");
  return <Navigate to={`/chat?${params.toString()}`} replace />;
};


const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RecoveryRedirect />
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Public marketing/billing */}
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/request-demo" element={<RequestDemo />} />
              <Route path="/billing/success" element={<ProtectedRoute><BillingSuccess /></ProtectedRoute>} />

              {/* Authenticated (any plan) */}
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

              {/* Paid-only app */}
              <Route path="/database" element={<PaidRoute requireGrowth><Dashboard /></PaidRoute>} />
              <Route path="/dashboard" element={<Navigate to="/database" replace />} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/monitor" element={<PaidRoute requireGrowth><Monitor /></PaidRoute>} />
              <Route path="/app" element={<Navigate to="/database" replace />} />

              {/* Marketing pages at root */}
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Resources content */}
              <Route path="/resources" element={<Resources />} />
              <Route path="/resources/home" element={<Index />} />
              <Route path="/resources/success" element={<ProtectedRoute><TopupSuccessRedirect /></ProtectedRoute>} />
              
              <Route path="/resources/:slug" element={<ResourceArticle />} />

              {/* Tools (canonical) */}
              <Route path="/tools" element={<ToolsHub />} />
              <Route path="/tools/:slug" element={<ToolTemplate />} />

              {/* Root: dashboard for signed-in, marketing for guests */}
              <Route path="/" element={<Root />} />

              {/* Legacy redirects */}
              <Route path="/resources/tools" element={<Navigate to="/tools" replace />} />
              <Route path="/resources/tools/:slug" element={<RedirectWithSlug to={(s) => `/tools/${s}`} />} />
              <Route path="/resources/about" element={<Navigate to="/about" replace />} />
              <Route path="/resources/blog" element={<Navigate to="/blog" replace />} />
              <Route path="/resources/privacy" element={<Navigate to="/privacy" replace />} />
              <Route path="/resources/terms" element={<Navigate to="/terms" replace />} />
              <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
              <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />

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
