import { useState } from "react";
import { ModernTemplate } from "./templates/ModernTemplate";
import { ProfessionalTemplate } from "./templates/ProfessionalTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { ElegantTemplate } from "./templates/ElegantTemplate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import type { ResumeData } from "@/pages/Index";

interface ResumePreviewProps {
  resumeData: ResumeData;
  selectedTemplate: 'modern' | 'professional' | 'minimal' | 'elegant';
  onTemplateChange: (template: 'modern' | 'professional' | 'minimal' | 'elegant') => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export const ResumePreview = ({ 
  resumeData, 
  selectedTemplate, 
  onTemplateChange,
  selectedColor,
  onColorChange
}: ResumePreviewProps) => {
  return (
    <div className="bg-glass-bg backdrop-blur-glass rounded-3xl shadow-glass border border-glass-border h-full flex flex-col overflow-hidden">
      <div className="bg-gradient-primary p-4 text-white flex flex-col gap-3 flex-shrink-0 rounded-t-3xl">
        <h2 className="text-xl font-bold text-center">Resume Preview</h2>
        <div className="flex gap-2 items-center justify-center flex-wrap">
          <ColorPicker value={selectedColor} onChange={onColorChange} />
          <Select value={selectedTemplate} onValueChange={onTemplateChange}>
            <SelectTrigger className="w-40 bg-white/90 text-gray-800 border-0 shadow-button">
              <SelectValue placeholder="Select Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">Modern Template</SelectItem>
              <SelectItem value="professional">Professional Template</SelectItem>
              <SelectItem value="minimal">Minimal Template</SelectItem>
              <SelectItem value="elegant">Elegant Template</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div 
        id="resume-content" 
        className="p-8 bg-white flex-1 overflow-y-auto rounded-b-3xl"
      >
        {selectedTemplate === 'modern' && <ModernTemplate resumeData={resumeData} color={selectedColor} />}
        {selectedTemplate === 'professional' && <ProfessionalTemplate resumeData={resumeData} color={selectedColor} />}
        {selectedTemplate === 'minimal' && <MinimalTemplate resumeData={resumeData} color={selectedColor} />}
        {selectedTemplate === 'elegant' && <ElegantTemplate resumeData={resumeData} color={selectedColor} />}
      </div>
    </div>
  );
};
