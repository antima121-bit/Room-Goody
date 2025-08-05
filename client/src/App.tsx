import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import RoomScanner from "@/pages/room-scanner";
import ObjectDetection from "@/pages/object-detection";
import Search from "@/pages/search";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/ui/navigation";
import MobileHeader from "@/components/ui/mobile-header";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <div className="w-8 h-8 bg-primary rounded-lg"></div>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container max-w-[430px] mx-auto min-h-screen bg-background relative shadow-xl">
      {isAuthenticated && <MobileHeader />}
      
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/room-scanner" component={RoomScanner} />
            <Route path="/object-detection" component={ObjectDetection} />
            <Route path="/search" component={Search} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {isAuthenticated && <Navigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
