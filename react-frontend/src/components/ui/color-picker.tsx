import React from 'react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#0ea5e9', // Sky Blue
  '#7c3aed', // Purple
  '#059669', // Green
  '#dc2626', // Red
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#be185d', // Pink
  '#374151', // Gray
  '#92400e', // Amber
  '#1f2937', // Dark Gray
  '#7c2d12', // Brown
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, className = '' }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-12 h-10 p-0 border-2 hover:scale-105 transition-transform"
          style={{ backgroundColor: value }}
        >
          <Palette className="w-4 h-4 text-white drop-shadow-sm" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="text-sm font-medium">Choose Color</div>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded-md border-2 transition-all hover:scale-110"
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
                title={color}
              />
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Custom Color</label>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 cursor-pointer"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
