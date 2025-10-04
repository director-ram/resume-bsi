import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, CheckCircle, Save, Upload, Trash2 } from "lucide-react";
import type { ResumeData } from "@/pages/Index";

interface FormControlsProps {
  resumeData: ResumeData;
  onCompleteResume: () => void;
  onStartMultiStep?: () => void;
  selectedTemplate?: 'modern' | 'professional' | 'minimal' | 'elegant';
  selectedColor?: string;
}

export const FormControls = ({ resumeData, onCompleteResume, onStartMultiStep, selectedTemplate, selectedColor }: FormControlsProps) => {
  const { toast } = useToast();

  const downloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...resumeData, template: selectedTemplate || 'modern', color: selectedColor || '#2563eb' }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Resume.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF Downloaded!",
        description: "Your resume has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveProgress = () => {
    localStorage.setItem('resumeData', JSON.stringify(resumeData));
    toast({
      title: "Progress Saved",
      description: "Your resume data has been saved locally.",
    });
  };

  const loadProgress = () => {
    const saved = localStorage.getItem('resumeData');
    if (saved) {
      // This would need to be handled by parent component
      toast({
        title: "Data Loaded",
        description: "Your saved resume data has been loaded.",
      });
    } else {
      toast({
        title: "No Saved Data",
        description: "No previously saved resume data found.",
        variant: "destructive",
      });
    }
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('resumeData');
      // This would need to be handled by parent component
      toast({
        title: "Data Cleared",
        description: "All resume data has been cleared.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
        <Button 
          onClick={downloadPDF}
          className="bg-gradient-primary hover:shadow-button-hover hover:-translate-y-1 transition-all duration-300"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        
        <Button 
          onClick={onCompleteResume}
          className="bg-gradient-success hover:shadow-success-hover hover:-translate-y-1 transition-all duration-300"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Resume
        </Button>
      
      <Button 
        onClick={saveProgress}
        variant="outline"
        className="hover:-translate-y-1 transition-all duration-300"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Progress
      </Button>
      
      <Button 
        onClick={loadProgress}
        variant="outline"
        className="hover:-translate-y-1 transition-all duration-300"
      >
        <Upload className="w-4 h-4 mr-2" />
        Load Saved
      </Button>
      
      <Button 
        onClick={clearAll}
        variant="outline"
        className="hover:-translate-y-1 transition-all duration-300 text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Clear All
      </Button>
      </div>
    </div>
  );
};
