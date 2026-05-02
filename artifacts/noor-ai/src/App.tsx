import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { LangProvider } from "@/lib/language";
import { ThemeProvider } from "@/lib/theme";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Videos from "@/pages/videos/index";
import VideoPlayer from "@/pages/videos/[id]";
import FutureSimulator from "@/pages/future";
import Subscribe from "@/pages/subscribe";
import AdminPanel from "@/pages/admin/index";
import AdminNoor from "@/pages/admin-noor/index";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Refund from "@/pages/refund";
import Leaderboard from "@/pages/leaderboard";
import Influencers from "@/pages/influencers";
import Promo from "@/pages/promo";
import NotFound from "@/pages/not-found";

const OWNER_EMAIL = "forthesky7@gmail.com";

const queryClient = new QueryClient();

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }
  if (!isAuthenticated) {
    return <Redirect to="/promo" />;
  }
  return <Home />;
}

function ProtectedRoute({
  component: Component,
  adminOnly = false,
  ownerOnly = false,
}: {
  component: React.ComponentType<any>;
  adminOnly?: boolean;
  ownerOnly?: boolean;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (ownerOnly && user?.email !== OWNER_EMAIL) {
    return <Redirect to="/dashboard" />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRoute} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/videos"><ProtectedRoute component={Videos} /></Route>
      <Route path="/videos/:id"><ProtectedRoute component={VideoPlayer} /></Route>
      <Route path="/future"><ProtectedRoute component={FutureSimulator} /></Route>
      <Route path="/subscribe"><ProtectedRoute component={Subscribe} /></Route>
      <Route path="/admin"><ProtectedRoute component={AdminPanel} adminOnly={true} /></Route>
      <Route path="/admin-noor"><ProtectedRoute component={AdminNoor} ownerOnly={true} /></Route>

      <Route path="/leaderboard"><ProtectedRoute component={Leaderboard} /></Route>
      <Route path="/influencers" component={Influencers} />
      <Route path="/promo" component={Promo} />

      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund" component={Refund} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LangProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </LangProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
