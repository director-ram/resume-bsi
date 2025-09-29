import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Download, ArrowLeft, Users, Zap, Award, Globe } from "lucide-react";
import type { ResumeData } from "@/pages/Index";

interface SuccessPageProps {
  resumeData: ResumeData;
  onBackToBuilder: () => void;
}

export const SuccessPage = ({ resumeData, onBackToBuilder }: SuccessPageProps) => {
  const handleDownloadPDF = () => {
    // PDF download functionality will be implemented
    console.log("Download PDF functionality to be implemented");
  };

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "ATS-Optimized",
      description: "Formatted to pass Applicant Tracking Systems with ease"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Enhanced",
      description: "Optimized content that highlights your best qualities"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Professional Design",
      description: "Beautiful templates that make a lasting impression"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Industry Standard",
      description: "Follows best practices used by top recruiters worldwide"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-background bg-[length:400%_400%] animate-gradient-shift p-8">
      <div className="max-w-6xl mx-auto">
        {/* Success Card */}
        <Card className="bg-gradient-success text-white rounded-3xl p-12 text-center shadow-success-hover relative overflow-hidden mb-8">
          {/* Animated background effect */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent animate-shimmer" />
          </div>
          
          <div className="relative z-10">
            <CheckCircle className="w-20 h-20 mx-auto mb-6 animate-float" />
            <h1 className="text-4xl font-bold mb-4">
              Congratulations! 🎉
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Your professional resume for <span className="font-semibold">{resumeData.personalInfo.fullName}</span> is ready to help you land your dream job!
            </p>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center bg-glass-bg backdrop-blur-glass border border-glass-border hover:shadow-card hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button 
            onClick={handleDownloadPDF}
            className="bg-gradient-primary hover:shadow-button-hover hover:-translate-y-1 transition-all duration-300 text-lg px-8 py-6"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF Resume
          </Button>
          
          <Button 
            onClick={onBackToBuilder}
            variant="outline"
            className="border-2 border-primary/20 hover:bg-primary/10 hover:-translate-y-1 transition-all duration-300 text-lg px-8 py-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Editor
          </Button>
        </div>

        {/* Next Steps */}
        <Card className="mt-12 p-8 bg-glass-bg backdrop-blur-glass border border-glass-border">
          <h2 className="text-2xl font-bold text-center mb-6">What's Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-gradient-warning rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Customize Further</h3>
              <p className="text-muted-foreground text-sm">Go back and fine-tune your resume with AI enhancements</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Apply with Confidence</h3>
              <p className="text-muted-foreground text-sm">Your resume is now ready for job applications</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white mx-auto mb-3">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Track Your Success</h3>
              <p className="text-muted-foreground text-sm">Monitor your application responses and iterate</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};