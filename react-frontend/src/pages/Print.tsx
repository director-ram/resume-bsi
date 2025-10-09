import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ModernTemplate } from "@/components/resume/templates/ModernTemplate";
import { ProfessionalTemplate } from "@/components/resume/templates/ProfessionalTemplate";
import { MinimalTemplate } from "@/components/resume/templates/MinimalTemplate";
import { ElegantTemplate } from "@/components/resume/templates/ElegantTemplate";
import type { ResumeData } from "@/pages/Index";

const PrintPage = () => {
  const [params] = useSearchParams();
  const template = (params.get("template") || "modern") as "modern" | "professional" | "minimal" | "elegant";
  const color = params.get("color") || undefined;
  
  // Debug logging
  console.log('PrintPage - Template:', template);
  console.log('PrintPage - Color:', color);

  // Read resume data from localStorage
  const resumeData = useMemo((): ResumeData => {
    try {
      const stored = localStorage.getItem("resumeData");
      if (!stored) {
        return {
          personalInfo: {
            fullName: "",
            email: "",
            phone: "",
            location: "",
            linkedin: "",
            github: "",
            summary: ""
          },
          experience: [],
          education: [],
          skills: "",
          projects: ""
        };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error parsing resume data from localStorage:", error);
      return {
        personalInfo: {
          fullName: "",
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          github: "",
          summary: ""
        },
        experience: [],
        education: [],
        skills: "",
        projects: ""
      };
    }
  }, []);

  // Signal to headless browser when the page is ready
  useEffect(() => {
    const done = () => {
      (window as any).__previewReady = true;
    };
    // Give a short delay for fonts/assets to settle
    const t = setTimeout(done, 300);
    return () => clearTimeout(t);
  }, []);

  // Render only the template without any UI controls
  const renderTemplate = () => {
    switch (template) {
      case 'modern':
        return <ModernTemplate resumeData={resumeData} color={color} />;
      case 'professional':
        return <ProfessionalTemplate resumeData={resumeData} color={color} />;
      case 'minimal':
        return <MinimalTemplate resumeData={resumeData} color={color} />;
      case 'elegant':
        return <ElegantTemplate resumeData={resumeData} color={color} />;
      default:
        return <ModernTemplate resumeData={resumeData} color={color} />;
    }
  };

  return (
    <div className="min-h-screen bg-white p-10">
      <div id="resume-content" className="max-w-[900px] mx-auto">
        {renderTemplate()}
      </div>
    </div>
  );
};

export default PrintPage;


