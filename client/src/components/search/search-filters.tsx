import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SearchCriteria } from "@shared/schema";

interface SearchFiltersProps {
  onFilterChange: (key: keyof SearchCriteria, value: any) => void;
}

const categories = [
  'Furniture',
  'Electronics',
  'Decor',
  'Appliances',
  'Lighting',
];

const subcategories = {
  Furniture: ['Sofa', 'Chair', 'Table', 'Bed', 'Cabinet', 'Shelf'],
  Electronics: ['Television', 'Computer', 'Phone', 'Speaker', 'Camera'],
  Decor: ['Painting', 'Vase', 'Mirror', 'Plant', 'Sculpture'],
  Appliances: ['Refrigerator', 'Microwave', 'Washer', 'Dryer', 'Dishwasher'],
  Lighting: ['Lamp', 'Chandelier', 'Pendant', 'Sconce', 'Track'],
};

const colors = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Black', value: '#1F2937' },
  { name: 'White', value: '#F9FAFB' },
];

const shapes = ['Rectangle', 'Circle', 'Square', 'Irregular'];

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onFilterChange('category', category || undefined);
    // Reset subcategory when category changes
    onFilterChange('subcategory', undefined);
  };

  const handleSubcategoryChange = (subcategory: string) => {
    onFilterChange('subcategory', subcategory || undefined);
  };

  const handleColorToggle = (colorName: string) => {
    const newColors = selectedColors.includes(colorName)
      ? selectedColors.filter(c => c !== colorName)
      : [...selectedColors, colorName];
    
    setSelectedColors(newColors);
    onFilterChange('color', newColors.length > 0 ? newColors : undefined);
  };

  const handleShapeChange = (shape: string) => {
    onFilterChange('shape', shape || undefined);
  };

  const handleBrandChange = (brand: string) => {
    onFilterChange('brand', brand.trim() || undefined);
  };

  const handleLocationChange = (location: string) => {
    onFilterChange('location', location.trim() || undefined);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Filters</h3>
      
      {/* Category Filter */}
      <div>
        <Label className="text-sm font-medium text-foreground">Category</Label>
        <Select onValueChange={handleCategoryChange}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory Filter */}
      {selectedCategory && (
        <div>
          <Label className="text-sm font-medium text-foreground">Type</Label>
          <Select onValueChange={handleSubcategoryChange}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {subcategories[selectedCategory as keyof typeof subcategories]?.map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Brand Filter */}
      <div>
        <Label className="text-sm font-medium text-foreground">Brand</Label>
        <Input
          onChange={(e) => handleBrandChange(e.target.value)}
          placeholder="Enter brand name"
          className="mt-2"
        />
      </div>

      {/* Color Filter */}
      <div>
        <Label className="text-sm font-medium text-foreground">Color</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {colors.map((color) => (
            <Button
              key={color.name}
              variant="outline"
              onClick={() => handleColorToggle(color.name)}
              className={`h-10 border-2 transition-colors ${
                selectedColors.includes(color.name)
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              <span className="sr-only">{color.name}</span>
            </Button>
          ))}
        </div>
        {selectedColors.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Selected: {selectedColors.join(', ')}
          </p>
        )}
      </div>

      {/* Shape Filter */}
      <div>
        <Label className="text-sm font-medium text-foreground">Shape</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {shapes.map((shape) => (
            <Button
              key={shape}
              variant="outline"
              size="sm"
              onClick={() => handleShapeChange(shape)}
              className="text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {shape}
            </Button>
          ))}
        </div>
      </div>

      {/* Location Filter */}
      <div>
        <Label className="text-sm font-medium text-foreground">Location</Label>
        <Input
          onChange={(e) => handleLocationChange(e.target.value)}
          placeholder="Enter city or coordinates"
          className="mt-2"
        />
      </div>
    </div>
  );
}
