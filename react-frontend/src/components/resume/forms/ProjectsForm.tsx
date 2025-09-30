import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Rocket, Plus, Trash2 } from "lucide-react";

interface ProjectsFormProps {
  data: string;
  onChange: (data: string) => void;
}

export const ProjectsForm = ({ data, onChange }: ProjectsFormProps) => {
  const [projects, setProjects] = useState<string[]>([]);

  // Split incoming data into individual projects by blank line separator
  useEffect(() => {
    const parts = (data || "")
      .split(/\n\s*\n+/)
      .map(p => p.trim())
      .filter(Boolean);
    setProjects(parts.length > 0 ? parts : [""]);
  }, [data]);

  const serialized = useMemo(() => projects.map(p => p.trim()).filter(Boolean).join("\n\n"), [projects]);

  useEffect(() => {
    if (serialized !== (data || "").trim()) {
      onChange(serialized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  const addProject = () => {
    setProjects(prev => [...prev, ""]);
  };

  const removeProject = (idx: number) => {
    setProjects(prev => prev.filter((_, i) => i !== idx));
  };

  const updateProject = (idx: number, value: string) => {
    setProjects(prev => prev.map((p, i) => (i === idx ? value : p)));
  };

  const enhanceProjects = async () => {
    try {
      const res = await fetch('/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'projects', content: serialized || '' })
      });
      const json = await res.json();
      if (json.success && json.enhanced_content) {
        // Re-split enhanced content back into entries
        const parts = String(json.enhanced_content)
          .split(/\n\s*\n+/)
          .map((p: string) => p.trim())
          .filter(Boolean);
        setProjects(parts.length > 0 ? parts : [""]);
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Projects
          </Label>
          <Button onClick={addProject} variant="outline" size="sm" className="bg-gradient-primary hover:shadow-button border-0 text-white">
            <Plus className="w-4 h-4 mr-1" />
            Add Project
          </Button>
        </div>

        {projects.map((proj, idx) => (
          <div key={idx} className="rounded-lg border border-muted/40 p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Project {idx + 1}</span>
              {projects.length > 1 && (
                <Button onClick={() => removeProject(idx)} variant="ghost" size="icon" aria-label="Remove project">
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            <Textarea
              placeholder={"Project name, tech stack, your role, impact/results."}
              value={proj}
              onChange={(e) => updateProject(idx, e.target.value)}
              className="border-2 focus:border-primary transition-colors bg-white min-h-[120px] resize-vertical"
            />
          </div>
        ))}

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
          Add each project separately. Include project name, technologies used, your role, and measurable outcomes.
        </p>
      </div>
    </Card>
  );
};