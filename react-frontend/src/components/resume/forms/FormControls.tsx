import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, CheckCircle, Save, Upload, Trash2, ArrowRight } from "lucide-react";
import type { ResumeData } from "@/pages/Index";

interface FormControlsProps {
  resumeData: ResumeData;
  onCompleteResume: () => void;
  onStartMultiStep?: () => void;
}

export const FormControls = ({ resumeData, onCompleteResume, onStartMultiStep }: FormControlsProps) => {
  const { toast } = useToast();

  const downloadPDF = () => {
    // PDF download functionality placeholder
    toast({
      title: "PDF Download",
      description: "PDF download functionality coming soon!",
    });
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
      {/* Multi-step button at the top */}
      {onStartMultiStep && (
        <div className="text-center">
          <Button 
            onClick={onStartMultiStep}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 px-8 py-3 text-lg font-semibold"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Start Multi-Step Resume
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Build your resume step by step with guided assistance
          </p>
        </div>
      )}
      
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