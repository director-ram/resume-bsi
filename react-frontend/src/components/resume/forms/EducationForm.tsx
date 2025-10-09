import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GraduationCap, Sparkles } from "lucide-react";
import type { ResumeData } from "@/pages/Index";
import { MonthPicker } from "@/components/resume/MonthPicker";

interface EducationFormProps {
  data: ResumeData['education'];
  onChange: (data: ResumeData['education']) => void;
}

export const EducationForm = ({ data, onChange }: EducationFormProps) => {
  const addEducation = () => {
    const newEducation = {
      id: Date.now().toString(),
      degree: '',
      school: '',
      graduationDate: '',
      gpa: '',
    };
    onChange([...data, newEducation]);
  };

  const removeEducation = (id: string) => {
    onChange(data.filter(edu => edu.id !== id));
  };

  // Capitalize first letter of each word
  const capitalizeWords = (text: string): string => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const updateEducation = (id: string, field: keyof ResumeData['education'][0], value: string) => {
    // Auto-capitalize degree and school fields
    if (field === 'degree' || field === 'school') {
      value = capitalizeWords(value);
    }
    
    onChange(data.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  return (
    <Card className="p-6 mb-6 bg-white rounded-2xl shadow-card border-t-4 border-t-warning">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Education
        </h3>
        <div className="flex gap-2">
          <Button 
            onClick={addEducation}
            className="bg-gradient-success hover:shadow-success text-white border-0"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Education
          </Button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No education added yet</p>
          <p className="text-sm">Add your educational background and achievements</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((edu, index) => (
            <Card key={edu.id} className="p-4 bg-muted/30 border-2 border-muted hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-foreground">Education #{index + 1}</h4>
                <Button
                  onClick={() => removeEducation(edu.id)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Degree
                  </Label>
                  <Input
                    placeholder="Bachelor of Science in Computer Science"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                    className="border-2 focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    School/University
                  </Label>
                  <Input
                    placeholder="University of Technology"
                    value={edu.school}
                    onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                    className="border-2 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Graduation Date
                  </Label>
                  <MonthPicker
                    value={edu.graduationDate}
                    onChange={(val) => updateEducation(edu.id, 'graduationDate', val)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    GPA (Optional)
                  </Label>
                  <Input
                    placeholder="3.8"
                    value={edu.gpa}
                    onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                    className="border-2 focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Enhance button always visible */}
      <div className="text-center mt-4">
        <Button
          onClick={async () => {
            if (data.length === 0) {
              alert('Please add at least one education entry before enhancing.');
              return;
            }
            
            const lines = data.map(edu => `${edu.degree} from ${edu.school}. ${edu.gpa ? `GPA: ${edu.gpa}. ` : ''}Graduated: ${edu.graduationDate}`.trim()).join('\n\n');
            try {
              const res = await fetch('/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section: 'education', content: lines })
              });
              const json = await res.json();
              if (json.success && json.enhanced_content) {
                const items = String(json.enhanced_content).split('\n\n');
                const updated = [...data];
                items.forEach((line, idx) => {
                  if (!updated[idx]) return;
                  
                  // Look for "from" pattern to extract degree and school
                  const fromMatch = line.match(/^\s*(.*?)\s+from\s+(.*?)(?:\s*\.|$)/i);
                  if (fromMatch) {
                    const [, degreeVal, schoolVal] = fromMatch;
                    updated[idx] = {
                      ...updated[idx],
                      degree: degreeVal.trim(),
                      school: schoolVal.trim(),
                    };
                  } else {
                    // If no "from" pattern, try to extract from the whole line
                    // Split by common separators and take first two parts
                    const parts = line.split(/[,\-–]/);
                    if (parts.length >= 2) {
                      updated[idx] = {
                        ...updated[idx],
                        degree: parts[0].trim(),
                        school: parts[1].trim(),
                      };
                    }
                  }
                });
                onChange(updated);
              } else if (json.error) {
                alert(json.error);
              }
            } catch (error) {
              alert('Enhancement failed. Please try again.');
            }
          }}
          variant="outline"
          size="sm"
          className="bg-gradient-warning hover:shadow-button border-0 text-white"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Enhance Education
        </Button>
      </div>
    </Card>
  );
};