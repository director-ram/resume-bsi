import { useState } from "react";
import { ModernTemplate } from "./templates/ModernTemplate";
import { ProfessionalTemplate } from "./templates/ProfessionalTemplate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ResumeData } from "@/pages/Index";

interface ResumePreviewProps {
  resumeData: ResumeData;
  selectedTemplate: 'modern' | 'professional';
  onTemplateChange: (template: 'modern' | 'professional') => void;
}

export const ResumePreview = ({ 
  resumeData, 
  selectedTemplate, 
  onTemplateChange 
}: ResumePreviewProps) => {
  return (
    <div className="bg-glass-bg backdrop-blur-glass rounded-3xl shadow-glass border border-glass-border overflow-hidden">
      <div className="bg-gradient-primary p-6 text-white flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resume Preview</h2>
        <Select value={selectedTemplate} onValueChange={onTemplateChange}>
          <SelectTrigger className="w-48 bg-white/90 text-foreground border-0 shadow-button">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modern">Modern Template</SelectItem>
            <SelectItem value="professional">Professional Template</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div 
        id="resume-content" 
        className="p-8 min-h-[600px] bg-white max-h-[calc(100vh-300px)] overflow-y-auto"
      >
        {selectedTemplate === 'modern' ? (
          <ModernTemplate resumeData={resumeData} />
        ) : (
          <ProfessionalTemplate resumeData={resumeData} />
        )}
      </div>
    </div>
  );
};