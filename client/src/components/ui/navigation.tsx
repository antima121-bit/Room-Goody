import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Camera, 
  Search, 
  User,
  HomeIcon
} from "lucide-react";

const navigationItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/room-scanner', icon: HomeIcon, label: 'Rooms' },
  { path: '/object-detection', icon: Camera, label: 'Detect' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="bg-white border-t border-border fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => setLocation(item.path)}
              className="flex flex-col items-center space-y-1 p-2 h-auto hover:bg-gray-100 transition-colors"
            >
              <Icon 
                className={`w-5 h-5 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
              <span 
                className={`text-xs ${
                  isActive 
                    ? 'text-primary font-medium' 
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
