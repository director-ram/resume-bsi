import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { ResumeData } from "@/pages/Index";

// Import step components
import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { ExperienceForm } from "./forms/ExperienceForm";
import { EducationForm } from "./forms/EducationForm";
import { SkillsForm } from "./forms/SkillsForm";
import { ProjectsForm } from "./forms/ProjectsForm";

interface MultiStepResumeProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
  onComplete: () => void;
  onBack: () => void;
}

const steps = [
  { id: 'personal', title: 'Personal Info', icon: '👤' },
  { id: 'experience', title: 'Experience', icon: '💼' },
  { id: 'education', title: 'Education', icon: '🎓' },
  { id: 'skills', title: 'Skills', icon: '⚡' },
  { id: 'projects', title: 'Projects', icon: '🚀' },
  { id: 'review', title: 'Review', icon: '📋' },
];

export const MultiStepResume = ({ 
  resumeData, 
  onResumeDataChange, 
  onComplete, 
  onBack 
}: MultiStepResumeProps) => {
  const [currentStep, setCurrentStep] = useState(0);

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

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Personal Info
        return resumeData.personalInfo.fullName && resumeData.personalInfo.email;
      case 1: // Experience
        return resumeData.experience.length > 0;
      case 2: // Education
        return resumeData.education.length > 0;
      case 3: // Skills
        return resumeData.skills.trim().length > 0;
      case 4: // Projects
        return resumeData.projects.trim().length > 0;
      case 5: // Review
        return true; // Always accessible
      default:
        return false;
    }
  };

  const canProceed = () => {
    return isStepComplete(currentStep);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonalInfoForm 
            data={resumeData.personalInfo}
            onChange={updatePersonalInfo}
          />
        );
      case 1:
        return (
          <ExperienceForm 
            data={resumeData.experience}
            onChange={updateExperience}
          />
        );
      case 2:
        return (
          <EducationForm 
            data={resumeData.education}
            onChange={updateEducation}
          />
        );
      case 3:
        return (
          <SkillsForm 
            data={resumeData.skills}
            onChange={updateSkills}
          />
        );
      case 4:
        return (
          <ProjectsForm 
            data={resumeData.projects}
            onChange={updateProjects}
          />
        );
      case 5:
        return (
          <div className="space-y-6">
            <Card className="p-6 bg-white rounded-2xl shadow-card border-t-4 border-t-primary">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                📋 Resume Review
              </h3>
              <p className="text-muted-foreground mb-6">
                Review your resume information and make any final adjustments before generating your professional resume.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p><strong>Name:</strong> {resumeData.personalInfo.fullName || 'Not provided'}</p>
                    <p><strong>Email:</strong> {resumeData.personalInfo.email || 'Not provided'}</p>
                    <p><strong>Phone:</strong> {resumeData.personalInfo.phone || 'Not provided'}</p>
                    <p><strong>Location:</strong> {resumeData.personalInfo.location || 'Not provided'}</p>
                    <p><strong>Summary:</strong> {resumeData.personalInfo.summary || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Experience ({resumeData.experience.length} entries)</h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    {resumeData.experience.length > 0 ? (
                      resumeData.experience.map((exp, index) => (
                        <div key={exp.id} className="mb-2">
                          <p><strong>{exp.title}</strong> at {exp.company}</p>
                          <p className="text-sm text-muted-foreground">{exp.startDate} - {exp.isCurrentJob ? 'Present' : exp.endDate}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No experience added</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Education ({resumeData.education.length} entries)</h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    {resumeData.education.length > 0 ? (
                      resumeData.education.map((edu, index) => (
                        <div key={edu.id} className="mb-2">
                          <p><strong>{edu.degree}</strong> from {edu.school}</p>
                          <p className="text-sm text-muted-foreground">Graduated: {edu.graduationDate}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No education added</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Skills</h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p>{resumeData.skills || 'No skills added'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Projects</h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p>{resumeData.projects || 'No projects added'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-glass-bg backdrop-blur-glass rounded-3xl p-8 shadow-glass border border-glass-border h-fit max-h-[calc(100vh-250px)] overflow-y-auto">
      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Multi-Step Resume Builder</h2>
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Builder
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                index === currentStep
                  ? 'border-primary bg-primary text-white'
                  : isStepComplete(index)
                  ? 'border-success bg-success text-white'
                  : 'border-muted text-muted-foreground'
              }`}>
                {isStepComplete(index) && index !== currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                index === currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  isStepComplete(index) ? 'bg-success' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={prevStep}
          disabled={currentStep === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={onComplete}
            className="bg-gradient-success hover:shadow-success text-white border-0 flex items-center gap-2"
          >
            Generate Resume
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="bg-gradient-primary hover:shadow-primary text-white border-0 flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
