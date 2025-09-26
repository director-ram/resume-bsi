import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { ExperienceForm } from "./forms/ExperienceForm";
import { EducationForm } from "./forms/EducationForm";
import { SkillsForm } from "./forms/SkillsForm";
import { ProjectsForm } from "./forms/ProjectsForm";
import { FormControls } from "./forms/FormControls";
import type { ResumeData } from "@/pages/Index";

interface ResumeFormProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
  onCompleteResume: () => void;
  onStartMultiStep?: () => void;
}

export const ResumeForm = ({ 
  resumeData, 
  onResumeDataChange, 
  onCompleteResume,
  onStartMultiStep
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
    <div className="bg-glass-bg backdrop-blur-glass rounded-3xl p-8 shadow-glass border border-glass-border h-fit max-h-[calc(100vh-250px)] overflow-y-auto">
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
      />
    </div>
  );
};