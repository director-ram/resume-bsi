import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { ExperienceForm } from "./forms/ExperienceForm";
import { EducationForm } from "./forms/EducationForm";
import { SkillsForm } from "./forms/SkillsForm";
import { ProjectsForm } from "./forms/ProjectsForm";
import { FormControls } from "./forms/FormControls";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { ResumeData } from "@/pages/Index";

interface ResumeFormProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
  onCompleteResume: () => void;
  onStartMultiStep?: () => void;
  selectedTemplate?: 'modern' | 'professional';
}

export const ResumeForm = ({ 
  resumeData, 
  onResumeDataChange, 
  onCompleteResume,
  onStartMultiStep,
  selectedTemplate
}: ResumeFormProps) => {
  const updatePersonalInfo = (personalInfo: ResumeData['personalInfo']) => {
    onResumeDataChange({ ...resumeData, personalInfo });
  };

  const updateExperience = (experience: ResumeData['experience']) => {
    onResumeDataChange({ ...resumeData, experience });
  };

  const updateEducation = (education: ResumeData['education']) => {
    onResumeDataChange({ ...resumeData, education });
  };

  const updateSkills = (skills: string) => {
    onResumeDataChange({ ...resumeData, skills });
  };

  const updateProjects = (projects: string) => {
    onResumeDataChange({ ...resumeData, projects });
  };

  return (
    <div className="space-y-6">
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
      
      <PersonalInfoForm 
        data={resumeData.personalInfo}
        onChange={updatePersonalInfo}
      />
      
      <ExperienceForm 
        data={resumeData.experience}
        onChange={updateExperience}
      />
      
      <EducationForm 
        data={resumeData.education}
        onChange={updateEducation}
      />
      
      <SkillsForm 
        data={resumeData.skills}
        onChange={updateSkills}
      />
      
      <ProjectsForm 
        data={resumeData.projects}
        onChange={updateProjects}
      />
      
      <FormControls 
        resumeData={resumeData}
        onCompleteResume={onCompleteResume}
        onStartMultiStep={onStartMultiStep}
        selectedTemplate={selectedTemplate}
      />
    </div>
  );
};