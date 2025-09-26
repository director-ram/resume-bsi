import { useNavigate } from "react-router-dom";
import { ResumeHeader } from "@/components/resume/ResumeHeader";
import { useResume } from "@/context/ResumeContext";
import { Button } from "@/components/ui/button";

const ReviewPage = () => {
  const navigate = useNavigate();
  const { resumeData, progress } = useResume();

  const handleGenerate = async () => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalInfo: resumeData.personalInfo,
          experience: resumeData.experience,
          education: resumeData.education,
          skills: resumeData.skills,
          projects: resumeData.projects,
          enhance: true
        })
      });

      if (!res.ok) throw new Error('Failed to generate resume');

      // Download the file from the response stream
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Enhanced_Resume.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // fallback to home on error
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background bg-[length:400%_400%] animate-gradient-shift">
      <div className="container mx-auto min-h-screen grid grid-rows-[auto_1fr] max-w-[1600px]">
        <ResumeHeader progress={progress} />
        <main className="p-6 md:p-8 max-w-4xl mx-auto w-full">
          <div className="bg-glass-bg backdrop-blur-glass rounded-3xl p-6 md:p-8 shadow-glass border border-glass-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Review & Generate</h2>
              <Button variant="outline" onClick={() => navigate('/multistep/projects')}>Back</Button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Personal Info</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p><strong>Name:</strong> {resumeData.personalInfo.fullName || '—'}</p>
                  <p><strong>Email:</strong> {resumeData.personalInfo.email || '—'}</p>
                  <p><strong>Phone:</strong> {resumeData.personalInfo.phone || '—'}</p>
                  <p><strong>Location:</strong> {resumeData.personalInfo.location || '—'}</p>
                  <p><strong>Summary:</strong> {resumeData.personalInfo.summary || '—'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Experience</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  {resumeData.experience.length > 0 ? (
                    resumeData.experience.map((e) => (
                      <div key={e.id} className="mb-2">
                        <p><strong>{e.title}</strong> at {e.company}</p>
                        <p className="text-sm text-muted-foreground">{e.startDate} - {e.isCurrentJob ? 'Present' : e.endDate}</p>
                        <p className="mt-1 whitespace-pre-wrap">{e.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No experience added</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Education</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  {resumeData.education.length > 0 ? (
                    resumeData.education.map((e) => (
                      <div key={e.id} className="mb-2">
                        <p><strong>{e.degree}</strong> from {e.school}</p>
                        <p className="text-sm text-muted-foreground">Graduated: {e.graduationDate}{e.gpa ? ` • GPA: ${e.gpa}` : ''}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No education added</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">{resumeData.skills || '—'}</div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Projects</h3>
                <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">{resumeData.projects || '—'}</div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button className="bg-gradient-success text-white border-0" onClick={handleGenerate}>Generate Resume</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReviewPage;


