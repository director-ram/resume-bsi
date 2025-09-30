import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Zap } from "lucide-react";

interface SkillsFormProps {
  data: string;
  onChange: (data: string) => void;
}

export const SkillsForm = ({ data, onChange }: SkillsFormProps) => {
  const enhanceSkills = async () => {
    try {
      const res = await fetch('/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'skills', content: data || '' })
      });
      const json = await res.json();
      if (json.success && json.enhanced_content) {
        onChange(json.enhanced_content);
      }
    } catch {}
  };

  return (
    <Card className="p-6 mb-6 bg-white rounded-2xl shadow-card border-t-4 border-t-primary">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Skills
        </h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Skills (comma-separated)
        </Label>
        <Textarea
          id="skills"
          placeholder="JavaScript, React, Node.js, Python, SQL, Git, Team Leadership, Project Management..."
          value={data}
          onChange={(e) => onChange(e.target.value)}
          className="border-2 focus:border-primary transition-colors bg-muted/50 min-h-[100px] resize-vertical"
        />
        <div className="text-center mt-2">
          <Button 
            onClick={enhanceSkills}
            variant="outline"
            size="sm"
            className="bg-gradient-warning hover:shadow-button border-0 text-white"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Enhance Skills
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Separate each skill with a comma. Include both technical and soft skills that are relevant to your target role.
        </p>
      </div>
    </Card>
  );
};