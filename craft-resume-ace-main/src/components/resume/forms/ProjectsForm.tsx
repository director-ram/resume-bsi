import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Rocket } from "lucide-react";

interface ProjectsFormProps {
  data: string;
  onChange: (data: string) => void;
}

export const ProjectsForm = ({ data, onChange }: ProjectsFormProps) => {
  const enhanceProjects = async () => {
    try {
      const res = await fetch('/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'projects', content: data || '' })
      });
      const json = await res.json();
      if (json.success && json.enhanced_content) {
        onChange(json.enhanced_content);
      }
    } catch {}
  };

  return (
    <Card className="p-6 mb-6 bg-white rounded-2xl shadow-card border-t-4 border-t-success">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          Projects
        </h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="projects" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Projects
        </Label>
        <Textarea
          id="projects"
          placeholder="Project 1: Description of your key project...&#10;Project 2: Another important project...&#10;&#10;Include project name, technologies used, and key achievements."
          value={data}
          onChange={(e) => onChange(e.target.value)}
          className="border-2 focus:border-primary transition-colors bg-muted/50 min-h-[150px] resize-vertical"
        />
        <div className="text-center mt-2">
          <Button 
            onClick={enhanceProjects}
            variant="outline"
            size="sm"
            className="bg-gradient-warning hover:shadow-button border-0 text-white"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Enhance Projects
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Describe your key projects, including technologies used, your role, and measurable outcomes.
        </p>
      </div>
    </Card>
  );
};