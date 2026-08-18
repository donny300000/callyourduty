import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import Onboarding from "@/pages/onboarding";
import Login from "@/pages/login";
import MapPage from "@/pages/map";
import LogFeed from "@/pages/log-feed";
import Groups from "@/pages/groups";
import GroupDetail from "@/pages/group-detail";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate() {
  const [mode, setMode] = useState<"signup" | "login">("signup");

  if (mode === "login") {
    return <Login onSwitchToSignup={() => setMode("signup")} />;
  }

  return <Onboarding onSwitchToLogin={() => setMode("login")} />;
}

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <AuthGate />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={MapPage} />
        <Route path="/log" component={LogFeed} />
        <Route path="/groups" component={Groups} />
        <Route path="/groups/:id" component={GroupDetail} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <ProtectedRoutes />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;