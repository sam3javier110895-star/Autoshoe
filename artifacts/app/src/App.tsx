import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import WhatsApp from "@/pages/WhatsApp";
import Grupos from "@/pages/Grupos";
import Automatizaciones from "@/pages/Automatizaciones";
import Reenvios from "@/pages/Reenvios";
import Disponibilidad from "@/pages/Disponibilidad";
import Contactos from "@/pages/Contactos";
import Monitor from "@/pages/Monitor";
import IA from "@/pages/IA";
import FlujosAgente from "@/pages/FlujosAgente";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!localStorage.getItem("sf_auth")) {
      navigate("/");
    }
  }, [navigate]);

  if (!localStorage.getItem("sf_auth")) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard">
        <RequireAuth>
          <Layout>
            <Dashboard />
          </Layout>
        </RequireAuth>
      </Route>
      <Route path="/whatsapp">
        <RequireAuth>
          <Layout>
            <WhatsApp />
          </Layout>
        </RequireAuth>
      </Route>
      <Route path="/grupos">
        <RequireAuth>
          <Layout>
            <Grupos />
          </Layout>
        </RequireAuth>
      </Route>
      <Route path="/automatizaciones">
        <RequireAuth>
          <Layout>
            <Automatizaciones />
          </Layout>
        </RequireAuth>
      </Route>
      <Route path="/reenvios">
        <RequireAuth>
          <Layout>
            <Reenvios />
          </Layout>
        </RequireAuth>
      </Route>
      <Route path="/disponibilidad">
        <RequireAuth>
          <Layout>
            <Disponibilidad />
          </Layout>
        </RequireAuth>
      </Route>
      <Route path="/contactos">
        <RequireAuth>
          <Layout>
            <Contactos />
          </Layout>
        </RequireAuth>
      </Route>
      <Route path="/monitor">
        <RequireAuth>
          <Layout>
            <Monitor />
          </Layout>
        </RequireAuth>
      </Route>
      <Route path="/ia">
        <RequireAuth>
          <Layout>
            <IA />
          </Layout>
        </RequireAuth>
      </Route>
      <Route path="/flujos">
        <RequireAuth>
          <Layout>
            <FlujosAgente />
          </Layout>
        </RequireAuth>
      </Route>
      <Route>
        <RequireAuth>
          <Layout>
            <Dashboard />
          </Layout>
        </RequireAuth>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
