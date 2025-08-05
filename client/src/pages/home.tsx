import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Home as HomeIcon, 
  Camera, 
  Search, 
  Wifi, 
  WifiOff,
  ChevronRight 
} from "lucide-react";

interface DashboardStats {
  totalRooms: number;
  totalObjects: number;
  recentActivity: Array<{
    type: 'room' | 'object';
    name: string;
    timestamp: string;
  }>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="pb-20">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Good morning, Alex</h2>
            <p className="text-primary-foreground/80">Ready to scan and detect?</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-primary-foreground/80">Sync Status</div>
            <div className="flex items-center space-x-2">
              <Wifi className="w-3 h-3 text-accent" />
              <span className="text-sm">Online</span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.totalRooms || 0}
            </div>
            <div className="text-xs text-primary-foreground/80">Rooms Scanned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.totalObjects || 0}
            </div>
            <div className="text-xs text-primary-foreground/80">Objects Detected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {isLoading ? "..." : (stats?.recentActivity?.length || 0)}
            </div>
            <div className="text-xs text-primary-foreground/80">Recent Items</div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Main Actions</h3>
        
        {/* Scan Room Card */}
        <Card 
          className="card-hover cursor-pointer transition-all duration-300 hover:shadow-lg" 
          onClick={() => setLocation('/room-scanner')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <HomeIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Scan Room</h4>
                <p className="text-sm text-muted-foreground">
                  Create room layouts with MagicPlan
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Object Detection Card */}
        <Card 
          className="card-hover cursor-pointer transition-all duration-300 hover:shadow-lg" 
          onClick={() => setLocation('/object-detection')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Object Detection</h4>
                <p className="text-sm text-muted-foreground">
                  Identify and catalog objects with AI
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Search Card */}
        <Card 
          className="card-hover cursor-pointer transition-all duration-300 hover:shadow-lg" 
          onClick={() => setLocation('/search')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Search</h4>
                <p className="text-sm text-muted-foreground">
                  Find rooms and objects instantly
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="px-6 pb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : stats?.recentActivity?.length ? (
            stats.recentActivity.map((activity, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activity.type === 'room' 
                        ? 'bg-blue-100' 
                        : 'bg-green-100'
                    }`}>
                      {activity.type === 'room' ? (
                        <HomeIcon className="w-4 h-4 text-primary" />
                      ) : (
                        <Camera className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{activity.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.type === 'room' ? 'Scanned' : 'Detected'} {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start by scanning a room or detecting objects
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
