import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { ResumeData } from "@/pages/Index";

interface ResumeContextValue {
  resumeData: ResumeData;
  setResumeData: (data: ResumeData) => void;
  progress: number;
}

const ResumeContext = createContext<ResumeContextValue | undefined>(undefined);

export const useResume = (): ResumeContextValue => {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used within ResumeProvider");
  return ctx;
};

export const ResumeProvider = ({ children }: { children: React.ReactNode }) => {
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem("resumeData");
    if (saved) {
      try { return JSON.parse(saved) as ResumeData; } catch {}
    }
    return {
      personalInfo: { fullName: "", email: "", phone: "", location: "", linkedin: "", summary: "" },
      experience: [],
      education: [],
      skills: "",
      projects: "",
    };
  });

  useEffect(() => {
    localStorage.setItem("resumeData", JSON.stringify(resumeData));
  }, [resumeData]);

  const progress = useMemo(() => {
    let completed = 0;
    const total = 5;
    if (resumeData.personalInfo.fullName && resumeData.personalInfo.email) completed++;
    if (resumeData.experience.length > 0) completed++;
    if (resumeData.education.length > 0) completed++;
    if (resumeData.skills.trim()) completed++;
    if (resumeData.projects.trim()) completed++;
    return Math.round((completed / total) * 100);
  }, [resumeData]);

  const value = useMemo(() => ({ resumeData, setResumeData, progress }), [resumeData, progress]);

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
};


