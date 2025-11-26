"use client";

import { useState } from "react";
import {
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { UserProfile, WorkExperience, Education, TechnicalSkill } from "@/types/user-profile";

interface EditableProfileProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => Promise<void>;
  isSaving: boolean;
}

// Personal Info Section
function PersonalInfoSection({
  profile,
  isEditing,
  editedData,
  setEditedData,
}: {
  profile: UserProfile;
  isEditing: boolean;
  editedData: Partial<UserProfile["personalInfo"]>;
  setEditedData: (data: Partial<UserProfile["personalInfo"]>) => void;
}) {
  if (isEditing) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={editedData.firstName ?? profile.personalInfo.firstName}
            onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={editedData.lastName ?? profile.personalInfo.lastName}
            onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={editedData.email ?? profile.personalInfo.email}
            onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={editedData.phone ?? profile.personalInfo.phone ?? ""}
            onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea
            id="summary"
            value={editedData.summary ?? profile.personalInfo.summary ?? ""}
            onChange={(e) => setEditedData({ ...editedData, summary: e.target.value })}
            rows={3}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <p className="text-2xl font-bold">
          {profile.personalInfo.firstName} {profile.personalInfo.lastName}
        </p>
        {profile.personalInfo.summary && (
          <p className="text-sm text-muted-foreground mt-1">
            {profile.personalInfo.summary}
          </p>
        )}
      </div>
      <div className="space-y-2 text-sm">
        {profile.personalInfo.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{profile.personalInfo.email}</span>
          </div>
        )}
        {profile.personalInfo.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{profile.personalInfo.phone}</span>
          </div>
        )}
        {profile.personalInfo.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {[
                profile.personalInfo.location.city,
                profile.personalInfo.location.state,
                profile.personalInfo.location.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Work Experience Item Editor
function WorkExperienceEditor({
  experience,
  onChange,
  onRemove,
}: {
  experience: WorkExperience;
  onChange: (exp: WorkExperience) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="grid gap-3 flex-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input
              value={experience.title}
              onChange={(e) => onChange({ ...experience, title: e.target.value })}
              placeholder="Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input
              value={experience.company}
              onChange={(e) => onChange({ ...experience, company: e.target.value })}
              placeholder="Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              value={experience.startDate}
              onChange={(e) => onChange({ ...experience, startDate: e.target.value })}
              placeholder="YYYY-MM"
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              value={experience.endDate ?? ""}
              onChange={(e) =>
                onChange({ ...experience, endDate: e.target.value || null })
              }
              placeholder="YYYY-MM or leave empty for current"
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} className="ml-2">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <div className="space-y-2">
        <Label>Responsibilities (one per line)</Label>
        <Textarea
          value={experience.responsibilities.join("\n")}
          onChange={(e) =>
            onChange({
              ...experience,
              responsibilities: e.target.value.split("\n").filter(Boolean),
            })
          }
          rows={4}
          placeholder="- Developed and maintained web applications&#10;- Led team of 5 engineers"
        />
      </div>
      <div className="space-y-2">
        <Label>Skills Used (comma separated)</Label>
        <Input
          value={experience.skillsUsed.join(", ")}
          onChange={(e) =>
            onChange({
              ...experience,
              skillsUsed: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="React, TypeScript, Node.js"
        />
      </div>
    </div>
  );
}

// Work Experience Section
function WorkExperienceSection({
  profile,
  isEditing,
  editedData,
  setEditedData,
}: {
  profile: UserProfile;
  isEditing: boolean;
  editedData: WorkExperience[];
  setEditedData: (data: WorkExperience[]) => void;
}) {
  const experiences = isEditing ? editedData : profile.workExperience;

  const addExperience = () => {
    const newExp: WorkExperience = {
      id: `exp_${Date.now()}`,
      title: "",
      company: "",
      startDate: "",
      endDate: null,
      isCurrent: false,
      responsibilities: [],
      achievements: [],
      skillsUsed: [],
      employmentType: "full-time",
    };
    setEditedData([...editedData, newExp]);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        {editedData.map((exp, i) => (
          <WorkExperienceEditor
            key={exp.id}
            experience={exp}
            onChange={(updated) => {
              const newData = [...editedData];
              newData[i] = updated;
              setEditedData(newData);
            }}
            onRemove={() => setEditedData(editedData.filter((_, idx) => idx !== i))}
          />
        ))}
        <Button variant="outline" onClick={addExperience} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {experiences.map((exp, i) => (
        <div key={exp.id || i} className="border-l-2 border-primary/20 pl-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{exp.title}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-3 w-3" />
                <span>{exp.company}</span>
                {exp.location && (
                  <>
                    <span>-</span>
                    <span>{exp.location}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {exp.startDate} - {exp.endDate || "Present"}
              </span>
            </div>
          </div>
          {exp.responsibilities.length > 0 && (
            <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
              {exp.responsibilities.slice(0, 3).map((resp, j) => (
                <li key={j}>{resp}</li>
              ))}
              {exp.responsibilities.length > 3 && (
                <li className="text-primary">
                  +{exp.responsibilities.length - 3} more...
                </li>
              )}
            </ul>
          )}
          {exp.skillsUsed.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {exp.skillsUsed.slice(0, 5).map((skill, j) => (
                <span key={j} className="px-2 py-0.5 text-xs rounded-full bg-muted">
                  {skill}
                </span>
              ))}
              {exp.skillsUsed.length > 5 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  +{exp.skillsUsed.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Education Section
function EducationSection({
  profile,
  isEditing,
  editedData,
  setEditedData,
}: {
  profile: UserProfile;
  isEditing: boolean;
  editedData: Education[];
  setEditedData: (data: Education[]) => void;
}) {
  const education = isEditing ? editedData : profile.education;

  const addEducation = () => {
    const newEdu: Education = {
      id: `edu_${Date.now()}`,
      institution: "",
      degree: "bachelor",
      field: "",
    };
    setEditedData([...editedData, newEdu]);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        {editedData.map((edu, i) => (
          <div key={edu.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="grid gap-3 flex-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => {
                      const newData = [...editedData];
                      newData[i] = { ...edu, institution: e.target.value };
                      setEditedData(newData);
                    }}
                    placeholder="University Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={edu.degree}
                    onChange={(e) => {
                      const newData = [...editedData];
                      newData[i] = { ...edu, degree: e.target.value as Education["degree"] };
                      setEditedData(newData);
                    }}
                  >
                    <option value="high-school">High School</option>
                    <option value="associate">Associate</option>
                    <option value="bachelor">Bachelor</option>
                    <option value="master">Master</option>
                    <option value="doctorate">Doctorate</option>
                    <option value="certificate">Certificate</option>
                    <option value="bootcamp">Bootcamp</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.field}
                    onChange={(e) => {
                      const newData = [...editedData];
                      newData[i] = { ...edu, field: e.target.value };
                      setEditedData(newData);
                    }}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Date</Label>
                  <Input
                    value={edu.graduationDate ?? ""}
                    onChange={(e) => {
                      const newData = [...editedData];
                      newData[i] = { ...edu, graduationDate: e.target.value || undefined };
                      setEditedData(newData);
                    }}
                    placeholder="YYYY-MM"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditedData(editedData.filter((_, idx) => idx !== i))}
                className="ml-2"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addEducation} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {education.map((edu, i) => (
        <div key={edu.id || i} className="border-l-2 border-primary/20 pl-4">
          <p className="font-semibold capitalize">
            {edu.degree.replace("-", " ")} in {edu.field}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-3 w-3" />
            <span>{edu.institution}</span>
            {edu.graduationDate && (
              <>
                <span>-</span>
                <span>{edu.graduationDate}</span>
              </>
            )}
          </div>
          {edu.gpa && (
            <p className="text-xs text-muted-foreground mt-1">GPA: {edu.gpa}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Skills Section
function SkillsSection({
  profile,
  isEditing,
  editedData,
  setEditedData,
}: {
  profile: UserProfile;
  isEditing: boolean;
  editedData: UserProfile["skills"];
  setEditedData: (data: UserProfile["skills"]) => void;
}) {
  const skills = isEditing ? editedData : profile.skills;

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Technical Skills (one per line, format: name | category | proficiency)</Label>
          <Textarea
            value={editedData.technical
              .map((s) => `${s.name} | ${s.category} | ${s.proficiency}`)
              .join("\n")}
            onChange={(e) => {
              const lines = e.target.value.split("\n").filter(Boolean);
              const technical = lines.map((line) => {
                const [name, category, proficiency] = line.split("|").map((s) => s.trim());
                return {
                  name: name || "",
                  category: (category as TechnicalSkill["category"]) || "other",
                  proficiency: (proficiency as TechnicalSkill["proficiency"]) || "intermediate",
                };
              });
              setEditedData({ ...editedData, technical });
            }}
            rows={6}
            placeholder="TypeScript | language | advanced&#10;React | framework | expert&#10;PostgreSQL | database | intermediate"
          />
          <p className="text-xs text-muted-foreground">
            Categories: language, framework, database, cloud, devops, tool, other
            <br />
            Proficiency: beginner, intermediate, advanced, expert
          </p>
        </div>
        <div className="space-y-2">
          <Label>Soft Skills (comma separated)</Label>
          <Input
            value={editedData.soft.map((s) => s.name).join(", ")}
            onChange={(e) => {
              const soft = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((name) => ({ name, proficiency: "advanced" as const }));
              setEditedData({ ...editedData, soft });
            }}
            placeholder="Leadership, Communication, Problem Solving"
          />
        </div>
        <div className="space-y-2">
          <Label>Languages (format: language | proficiency, separated by commas)</Label>
          <Input
            value={editedData.languages
              .map((l) => `${l.language} | ${l.proficiency}`)
              .join(", ")}
            onChange={(e) => {
              const languages = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((item) => {
                  const [language, proficiency] = item.split("|").map((s) => s.trim());
                  return {
                    language: language || "",
                    proficiency:
                      (proficiency as "native" | "professional-working") || "professional-working",
                  };
                });
              setEditedData({ ...editedData, languages });
            }}
            placeholder="English | native, German | professional-working"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {skills.technical.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Technical Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.technical.map((skill, i) => (
              <span
                key={i}
                className={`px-3 py-1 text-sm rounded-full ${
                  skill.proficiency === "expert"
                    ? "bg-primary text-primary-foreground"
                    : skill.proficiency === "advanced"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted"
                }`}
              >
                {skill.name}
                {skill.proficiency && (
                  <span className="ml-1 text-xs opacity-70">({skill.proficiency})</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.soft.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Soft Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.soft.map((skill, i) => (
              <span key={i} className="px-3 py-1 text-sm rounded-full bg-muted">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.languages.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Languages</p>
          <div className="flex flex-wrap gap-2">
            {skills.languages.map((lang, i) => (
              <span key={i} className="px-3 py-1 text-sm rounded-full bg-muted">
                {lang.language}{" "}
                <span className="text-xs opacity-70">
                  ({lang.proficiency.replace("-", " ")})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Editable Profile Component
export function EditableProfile({ profile, onSave, isSaving }: EditableProfileProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    experience: true,
    education: true,
    skills: true,
  });

  // Edited data states
  const [editedPersonalInfo, setEditedPersonalInfo] = useState<Partial<UserProfile["personalInfo"]>>({});
  const [editedExperience, setEditedExperience] = useState<WorkExperience[]>([]);
  const [editedEducation, setEditedEducation] = useState<Education[]>([]);
  const [editedSkills, setEditedSkills] = useState<UserProfile["skills"]>({
    technical: [],
    soft: [],
    languages: [],
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const startEditing = (section: string) => {
    setEditingSection(section);
    if (section === "personal") {
      setEditedPersonalInfo({});
    } else if (section === "experience") {
      setEditedExperience([...profile.workExperience]);
    } else if (section === "education") {
      setEditedEducation([...profile.education]);
    } else if (section === "skills") {
      setEditedSkills({ ...profile.skills });
    }
  };

  const cancelEditing = () => {
    setEditingSection(null);
  };

  const saveSection = async (section: string) => {
    let updatedProfile = { ...profile };

    if (section === "personal") {
      updatedProfile = {
        ...profile,
        personalInfo: {
          ...profile.personalInfo,
          ...editedPersonalInfo,
        },
      };
    } else if (section === "experience") {
      updatedProfile = {
        ...profile,
        workExperience: editedExperience,
      };
    } else if (section === "education") {
      updatedProfile = {
        ...profile,
        education: editedEducation,
      };
    } else if (section === "skills") {
      updatedProfile = {
        ...profile,
        skills: editedSkills,
      };
    }

    await onSave(updatedProfile);
    setEditingSection(null);
  };

  const sections = [
    {
      id: "personal",
      icon: User,
      title: "Personal Information",
      content: (
        <PersonalInfoSection
          profile={profile}
          isEditing={editingSection === "personal"}
          editedData={editedPersonalInfo}
          setEditedData={setEditedPersonalInfo}
        />
      ),
    },
    {
      id: "experience",
      icon: Briefcase,
      title: `Work Experience (${profile.workExperience.length})`,
      content: (
        <WorkExperienceSection
          profile={profile}
          isEditing={editingSection === "experience"}
          editedData={editedExperience}
          setEditedData={setEditedExperience}
        />
      ),
    },
    {
      id: "education",
      icon: GraduationCap,
      title: `Education (${profile.education.length})`,
      content: (
        <EducationSection
          profile={profile}
          isEditing={editingSection === "education"}
          editedData={editedEducation}
          setEditedData={setEditedEducation}
        />
      ),
    },
    {
      id: "skills",
      icon: Wrench,
      title: `Skills (${profile.skills.technical.length} technical)`,
      content: (
        <SkillsSection
          profile={profile}
          isEditing={editingSection === "skills"}
          editedData={editedSkills}
          setEditedData={setEditedSkills}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const Icon = section.icon;
        const isEditing = editingSection === section.id;
        const isExpanded = expandedSections[section.id];

        return (
          <div key={section.id} className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">{section.title}</h3>
              </button>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSection(section.id)}
                      disabled={isSaving}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(section.id)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <button onClick={() => toggleSection(section.id)}>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
            {(isExpanded || isEditing) && (
              <div className="px-4 pb-4">{section.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
