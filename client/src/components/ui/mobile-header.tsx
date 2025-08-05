import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Box, 
  Bell, 
  User 
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function MobileHeader() {
  const { user } = useAuth() as { user: UserType | null };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Box className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">RoomScanner</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-lg hover:bg-gray-100"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            className="rounded-lg hover:bg-gray-100"
          >
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
