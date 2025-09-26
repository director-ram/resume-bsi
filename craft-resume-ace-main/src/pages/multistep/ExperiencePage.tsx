import { useNavigate } from "react-router-dom";
import { ResumeHeader } from "@/components/resume/ResumeHeader";
import { ExperienceForm } from "@/components/resume/forms/ExperienceForm";
import { useResume } from "@/context/ResumeContext";
import { Button } from "@/components/ui/button";

const ExperiencePage = () => {
  const navigate = useNavigate();
  const { resumeData, setResumeData, progress } = useResume();

  return (
    <div className="min-h-screen bg-gradient-background bg-[length:400%_400%] animate-gradient-shift">
      <div className="container mx-auto min-h-screen grid grid-rows-[auto_1fr] max-w-[1600px]">
        <ResumeHeader progress={progress} />
        <main className="p-6 md:p-8 max-w-3xl mx-auto w-full">
          <div className="bg-glass-bg backdrop-blur-glass rounded-3xl p-6 md:p-8 shadow-glass border border-glass-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Step 2 of 5: Experience</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/multistep/personal')}>Back</Button>
                <Button variant="outline" onClick={() => navigate('/')}>Exit</Button>
              </div>
            </div>
            <ExperienceForm 
              data={resumeData.experience}
              onChange={(data) => setResumeData({ ...resumeData, experience: data })}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/multistep/personal')}>Previous</Button>
              <Button className="bg-gradient-primary text-white border-0" onClick={() => navigate('/multistep/education')}>Next</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExperiencePage;


