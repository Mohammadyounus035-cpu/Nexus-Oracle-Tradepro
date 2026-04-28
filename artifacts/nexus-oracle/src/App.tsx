import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { MarketProvider } from "./context/MarketContext";
import Layout from "./components/Layout";
import Console from "./pages/Console";
import Lattice from "./pages/Lattice";
import TradePro from "./pages/TradePro";
import Markets from "./pages/Markets";
import Codex from "./pages/Codex";
import MysticMap from "./pages/MysticMap";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/" component={Console} />
        <Route path="/lattice" component={Lattice} />
        <Route path="/tradepro" component={TradePro} />
        <Route path="/markets" component={Markets} />
        <Route path="/codex" component={Codex} />
        <Route path="/mystic-map" component={MysticMap} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Layout>
              <Router />
            </Layout>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </MarketProvider>
    </QueryClientProvider>
  );
}

export default App;
