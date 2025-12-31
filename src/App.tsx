import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlassNav, PageTransition } from "@/components/eku";
import Landing from "./pages/Landing";
import CreateWizard from "./pages/CreateWizard";
import CreateStatus from "./pages/CreateStatus";
import AdventureResults from "./pages/AdventureResults";
import Gallery from "./pages/Gallery";
import ParentControls from "./pages/ParentControls";
import Account from "./pages/Account";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GlassNav />
        <PageTransition>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/create" element={<CreateWizard />} />
            <Route path="/create/status" element={<CreateStatus />} />
            <Route path="/adventure/:jobId" element={<AdventureResults />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/parents" element={<ParentControls />} />
            <Route path="/account" element={<Account />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;