import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SearchFilters from "@/components/search/search-filters";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  ArrowLeft, 
  Search as SearchIcon, 
  Download,
  ChevronRight,
  Filter,
  X
} from "lucide-react";
import type { SearchCriteria, DetectedObject } from "@shared/schema";

export default function Search() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (criteria: SearchCriteria) => {
      const response = await apiRequest('POST', '/api/search', criteria);
      return response.json();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/export/objects');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'detected-objects.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Search results exported successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export results.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    const criteria: SearchCriteria = {
      ...searchCriteria,
      textQuery: searchQuery.trim() || undefined,
    };
    searchMutation.mutate(criteria);
  };

  const updateFilter = (key: keyof SearchCriteria, value: any) => {
    const newCriteria = { ...searchCriteria, [key]: value };
    setSearchCriteria(newCriteria);
    
    // Update active filters
    const filters = [];
    if (newCriteria.category) filters.push(`Category: ${newCriteria.category}`);
    if (newCriteria.subcategory) filters.push(`Type: ${newCriteria.subcategory}`);
    if (newCriteria.color && newCriteria.color.length > 0) {
      filters.push(`Color: ${newCriteria.color.join(', ')}`);
    }
    if (newCriteria.shape) filters.push(`Shape: ${newCriteria.shape}`);
    if (newCriteria.brand) filters.push(`Brand: ${newCriteria.brand}`);
    setActiveFilters(filters);
  };

  const removeFilter = (filterText: string) => {
    const newCriteria = { ...searchCriteria };
    
    if (filterText.startsWith('Category:')) {
      delete newCriteria.category;
    } else if (filterText.startsWith('Type:')) {
      delete newCriteria.subcategory;
    } else if (filterText.startsWith('Color:')) {
      delete newCriteria.color;
    } else if (filterText.startsWith('Shape:')) {
      delete newCriteria.shape;
    } else if (filterText.startsWith('Brand:')) {
      delete newCriteria.brand;
    }
    
    setSearchCriteria(newCriteria);
  };

  const clearAllFilters = () => {
    setSearchCriteria({});
    setActiveFilters([]);
    setSearchQuery('');
  };

  useEffect(() => {
    if (Object.keys(searchCriteria).length > 0 || searchQuery.trim()) {
      handleSearch();
    }
  }, [searchCriteria]);

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
      {/* Header */}
      <div className="bg-white border-b border-border p-4 flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
          className="rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">Advanced Search</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search rooms and objects..."
            className="pl-12 pr-12"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-lg"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="slide-up">
            <CardContent className="p-4">
              <SearchFilters onFilterChange={updateFilter} />
            </CardContent>
          </Card>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Active Filters</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center space-x-1 bg-primary text-primary-foreground"
                >
                  <span>{filter}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter)}
                    className="h-auto p-0 ml-1 hover:bg-primary/80 text-primary-foreground"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Search Results</h3>
            <span className="text-sm text-muted-foreground">
              {searchMutation.data?.length || 0} items found
            </span>
          </div>

          {searchMutation.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <div className="w-20 h-20 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchMutation.data?.length > 0 ? (
            <div className="space-y-3">
              {searchMutation.data.map((item: DetectedObject) => {
                const firstObject = (item.objects as any)?.[0];
                const colors = (item.colors as any);
                
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex space-x-3">
                        {item.imageUri && (
                          <img 
                            src={item.imageUri} 
                            alt={firstObject?.label || 'Detected object'} 
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">
                            {firstObject?.label || 'Unknown Object'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {firstObject?.category || 'Unknown Category'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            {firstObject?.brand && (
                              <span>Brand: {firstObject.brand}</span>
                            )}
                            {colors?.dominant && (
                              <span>Color: {colors.dominant}</span>
                            )}
                            <span>
                              {formatTimeAgo(item.createdAt?.toString() || '')}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-lg">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : searchMutation.data !== undefined ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No objects found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search criteria
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Export Options */}
        {searchMutation.data?.length > 0 && (
          <div className="pt-4 border-t border-border">
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportMutation.isPending ? 'Exporting...' : 'Export Search Results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
