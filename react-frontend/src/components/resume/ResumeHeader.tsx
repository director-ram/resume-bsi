interface ResumeHeaderProps {
  progress: number;
}

export const ResumeHeader = ({ progress }: ResumeHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 text-white text-center border-b border-white/10 bg-gradient-to-r from-[#667eea]/70 via-[#764ba2]/70 to-[#667eea]/70 backdrop-blur-md">
      <div className="px-4 py-3 md:py-4">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        Professional Resume Builder
      </h1>
      <p className="text-sm md:text-base opacity-95 mb-3">
        Create stunning, ATS-friendly resumes with AI enhancement in minutes
      </p>
      <div className="max-w-2xl mx-auto bg-white/15 rounded-full p-1 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]">
        <div
          className="h-2.5 md:h-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700 ease-out shadow-[0_4px_14px_rgba(16,185,129,0.45)]"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
      <p className="text-xs mt-1 opacity-90 tracking-wide">
        {progress}% Complete
      </p>
      </div>
    </header>
  );
};