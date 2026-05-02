import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import ToolsHub from "./pages/ToolsHub";
import ToolTemplate from "./pages/ToolTemplate";
import Resources from "./pages/Resources";
import ResourceArticle from "./pages/ResourceArticle";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Redirect helpers — preserve params and forward old URLs to /resources/*
const RedirectWithSlug = ({ to }: { to: (slug: string) => string }) => {
  const { slug } = useParams();
  return <Navigate to={to(slug || "")} replace />;
};

// Reserved root-level slugs that should NOT be treated as legacy article slugs
const RESERVED_ROOT = new Set(["resources", "tools", "about", ""]);

const LegacySlugRedirect = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\/+/, "").split("/")[0];
  if (!slug || RESERVED_ROOT.has(slug)) {
    return <NotFound />;
  }
  return <Navigate to={`/resources/${slug}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* New canonical routes — all content lives under /resources/* */}
          <Route path="/resources" element={<Resources />} />
          <Route path="/resources/home" element={<Index />} />
          <Route path="/resources/tools" element={<ToolsHub />} />
          <Route path="/resources/tools/:slug" element={<ToolTemplate />} />
          <Route path="/resources/about" element={<About />} />
          <Route path="/resources/:slug" element={<ResourceArticle />} />

          {/* Legacy URL redirects — preserve SEO and external links */}
          <Route path="/" element={<Navigate to="/resources" replace />} />
          <Route path="/tools" element={<Navigate to="/resources/tools" replace />} />
          <Route
            path="/tools/:slug"
            element={<RedirectWithSlug to={(s) => `/resources/tools/${s}`} />}
          />
          <Route path="/about" element={<Navigate to="/resources/about" replace />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* Legacy article slugs at root → /resources/:slug */}
          <Route path="/:slug" element={<LegacySlugRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
