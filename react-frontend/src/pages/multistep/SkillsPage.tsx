import { useNavigate } from "react-router-dom";
import { ResumeHeader } from "@/components/resume/ResumeHeader";
import { SkillsForm } from "@/components/resume/forms/SkillsForm";
import { useResume } from "@/context/ResumeContext";
import { Button } from "@/components/ui/button";

const SkillsPage = () => {
  const navigate = useNavigate();
  const { resumeData, setResumeData, progress } = useResume();

  return (
    <div className="min-h-screen bg-gradient-background bg-[length:400%_400%] animate-gradient-shift">
      <div className="container mx-auto min-h-screen grid grid-rows-[auto_1fr] max-w-[1600px]">
        <ResumeHeader progress={progress} />
        <main className="p-6 md:p-8 max-w-3xl mx-auto w-full">
          <div className="bg-glass-bg backdrop-blur-glass rounded-3xl p-6 md:p-8 shadow-glass border border-glass-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Step 4 of 5: Skills</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/multistep/education')}>Back</Button>
                <Button variant="outline" onClick={() => navigate('/')}>Exit</Button>
              </div>
            </div>
            <SkillsForm 
              data={resumeData.skills}
              onChange={(data) => setResumeData({ ...resumeData, skills: data })}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/multistep/education')}>Previous</Button>
              <Button className="bg-gradient-primary text-white border-0" onClick={() => navigate('/multistep/projects')}>Next</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SkillsPage;


