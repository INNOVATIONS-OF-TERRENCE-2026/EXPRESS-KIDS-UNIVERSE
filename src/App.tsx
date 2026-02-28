import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GlassNav, PageTransition3D } from "@/components/eku";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StudioIntro } from "@/components/StudioIntro";
import Landing from "./pages/Landing";
import CreateWizard from "./pages/CreateWizard";
import CreateStatus from "./pages/CreateStatus";
import AdventureResults from "./pages/AdventureResults";
import Gallery from "./pages/Gallery";
import ParentControls from "./pages/ParentControls";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Leadership from "./pages/Leadership";
import StudioDashboard from "./pages/StudioDashboard";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <GlassNav />
      <PageTransition3D>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/leadership" element={<Leadership />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/dashboard" element={<ProtectedRoute><StudioDashboard /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateWizard /></ProtectedRoute>} />
          <Route path="/create/status" element={<ProtectedRoute><CreateStatus /></ProtectedRoute>} />
          <Route path="/adventure/:storyId" element={<ProtectedRoute><AdventureResults /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/parents" element={<ProtectedRoute><ParentControls /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition3D>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StudioIntro />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
