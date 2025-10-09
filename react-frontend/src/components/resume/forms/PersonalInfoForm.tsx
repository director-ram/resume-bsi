import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { CountryCodePicker } from "@/components/ui/country-code-picker";
import { useState } from "react";
import type { ResumeData } from "@/pages/Index";

interface PersonalInfoFormProps {
  data: ResumeData['personalInfo'];
  onChange: (data: ResumeData['personalInfo']) => void;
}

export const PersonalInfoForm = ({ data, onChange }: PersonalInfoFormProps) => {
  const [countryCode, setCountryCode] = useState("+1");
  
  const updateField = (field: keyof ResumeData['personalInfo'], value: string) => {
    onChange({ ...data, [field]: value });
  };

  // Get full phone number with country code
  const getFullPhoneNumber = (phone: string): string => {
    return `${countryCode} ${phone}`;
  };

  // Validate phone number format (without country code)
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if phone has 7-15 digits (excluding country code)
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  // Get phone validation message
  const getPhoneValidationMessage = (phone: string): string => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      return 'Phone number must have at least 7 digits';
    }
    if (digitsOnly.length > 15) {
      return 'Phone number cannot exceed 15 digits';
    }
    return '';
  };

  // Capitalize name properly
  const formatName = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const enhanceSummary = async () => {
    try {
      // Validate phone number if provided
      if (data.phone) {
        const validationMessage = getPhoneValidationMessage(data.phone);
        if (validationMessage) {
          alert(validationMessage);
          return;
        }
      }

      const res = await fetch('/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          section: 'summary', 
          content: data.summary || '',
          validation: { phone: data.phone ? getFullPhoneNumber(data.phone) : '' }
        })
      });
      const json = await res.json();
      if (json.success && json.enhanced_content) {
        updateField('summary', json.enhanced_content);
      } else if (json.error) {
        alert(json.error);
      }
    } catch {}
  };

  return (
    <Card className="p-6 mb-6 bg-white rounded-2xl shadow-card border-t-4 border-t-primary">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          👤 Personal Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Full Name *
          </Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={data.fullName}
            onChange={(e) => updateField('fullName', formatName(e.target.value))}
            className="border-2 focus:border-primary transition-colors bg-muted/50"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={data.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="border-2 focus:border-primary transition-colors bg-muted/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Phone
          </Label>
          <div className="flex gap-2">
            <CountryCodePicker
              value={countryCode}
              onChange={setCountryCode}
              className="w-32"
            />
            <Input
              id="phone"
              placeholder="(555) 123-4567"
              value={data.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className={`flex-1 border-2 focus:border-primary transition-colors bg-muted/50 ${
                data.phone && !validatePhoneNumber(data.phone) ? 'border-red-500' : ''
              }`}
            />
          </div>
          {data.phone && !validatePhoneNumber(data.phone) && (
            <p className="text-xs text-red-500">{getPhoneValidationMessage(data.phone)}</p>
          )}
          {data.phone && validatePhoneNumber(data.phone) && (
            <p className="text-xs text-green-600">Full number: {getFullPhoneNumber(data.phone)}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Location
          </Label>
          <Input
            id="location"
            placeholder="New York, NY"
            value={data.location}
            onChange={(e) => updateField('location', e.target.value)}
            className="border-2 focus:border-primary transition-colors bg-muted/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            LinkedIn Profile
          </Label>
          <Input
            id="linkedin"
            placeholder="linkedin.com/in/johndoe"
            value={data.linkedin}
            onChange={(e) => updateField('linkedin', e.target.value)}
            className="border-2 focus:border-primary transition-colors bg-muted/50"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="github" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            GitHub Profile
          </Label>
          <Input
            id="github"
            placeholder="github.com/johndoe"
            value={data.github}
            onChange={(e) => updateField('github', e.target.value)}
            className="border-2 focus:border-primary transition-colors bg-muted/50"
          />
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <Label htmlFor="summary" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Professional Summary
        </Label>
        <Textarea
          id="summary"
          placeholder="Brief summary of your professional background and key achievements..."
          value={data.summary}
          onChange={(e) => updateField('summary', e.target.value)}
          className="border-2 focus:border-primary transition-colors bg-muted/50 min-h-[100px] resize-vertical"
        />
        <div className="text-center mt-2">
          <Button 
            onClick={enhanceSummary}
            variant="outline" 
            size="sm"
            className="bg-gradient-warning hover:shadow-button border-0 text-white"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Enhance Summary
          </Button>
        </div>
      </div>
    </Card>
  );
};