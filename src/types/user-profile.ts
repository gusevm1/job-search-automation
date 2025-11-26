import { z } from "zod";

// ============================================
// Personal Information
// ============================================
export const PersonalInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.object({
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string(),
    postalCode: z.string().nullable().optional(),
    willingToRelocate: z.boolean().default(false),
    relocationPreferences: z.array(z.string()).optional(),
  }),
  linkedIn: z.string().optional(), // Can be URL or just username/path
  github: z.string().optional(), // Can be URL or just username
  portfolio: z.string().url().optional(),
  summary: z.string().optional(),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

// ============================================
// Work Experience
// ============================================
export const WorkExperienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  companySize: z
    .enum(["startup", "small", "medium", "large", "enterprise"])
    .optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  remote: z.enum(["remote", "hybrid", "on-site"]).optional(),
  startDate: z.string(), // ISO date
  endDate: z.string().nullable(), // null = current
  isCurrent: z.boolean().default(false),
  responsibilities: z.array(z.string()),
  achievements: z.array(
    z.object({
      description: z.string(),
      metric: z.string().nullable().optional(),
    })
  ),
  skillsUsed: z.array(z.string()),
  employmentType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "freelance",
    "internship",
  ]).optional().default("full-time"),
});

export type WorkExperience = z.infer<typeof WorkExperienceSchema>;

// ============================================
// Education
// ============================================
export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.enum([
    "high-school",
    "associate",
    "bachelor",
    "master",
    "doctorate",
    "professional",
    "certificate",
    "bootcamp",
  ]),
  field: z.string(),
  startDate: z.string().optional(),
  graduationDate: z.string().optional(),
  gpa: z.number().min(0).max(10).optional(), // Supports various grading systems (US 4.0, European 6.0, etc.)
  honors: z.string().optional(),
  relevantCoursework: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
});

export type Education = z.infer<typeof EducationSchema>;

// ============================================
// Skills
// ============================================
export const SkillProficiencySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export type SkillProficiency = z.infer<typeof SkillProficiencySchema>;

export const TechnicalSkillSchema = z.object({
  name: z.string(),
  category: z.enum([
    "language",
    "framework",
    "database",
    "cloud",
    "devops",
    "tool",
    "other",
  ]),
  proficiency: SkillProficiencySchema,
  yearsOfExperience: z.number().optional(),
  lastUsed: z.string().optional(),
});

export type TechnicalSkill = z.infer<typeof TechnicalSkillSchema>;

export const SoftSkillSchema = z.object({
  name: z.string(),
  proficiency: SkillProficiencySchema.optional(),
});

export type SoftSkill = z.infer<typeof SoftSkillSchema>;

export const LanguageSkillSchema = z.object({
  language: z.string(),
  proficiency: z.enum([
    "elementary",
    "limited-working",
    "professional-working",
    "full-professional",
    "native",
  ]),
  certifications: z.array(z.string()).optional(),
});

export type LanguageSkill = z.infer<typeof LanguageSkillSchema>;

export const SkillsSchema = z.object({
  technical: z.array(TechnicalSkillSchema),
  soft: z.array(SoftSkillSchema),
  languages: z.array(LanguageSkillSchema),
});

export type Skills = z.infer<typeof SkillsSchema>;

// ============================================
// Certifications
// ============================================
export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string(),
  expirationDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional(),
});

export type Certification = z.infer<typeof CertificationSchema>;

// ============================================
// Projects
// ============================================
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  url: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  technologies: z.array(z.string()),
  highlights: z.array(z.string()),
});

export type Project = z.infer<typeof ProjectSchema>;

// ============================================
// Job Preferences
// ============================================
export const SalaryExpectationSchema = z.object({
  minimum: z.number(),
  target: z.number().optional(),
  maximum: z.number().optional(),
  currency: z.string().default("USD"),
  period: z.enum(["hourly", "daily", "monthly", "yearly"]).default("yearly"),
  negotiable: z.boolean().default(true),
});

export type SalaryExpectation = z.infer<typeof SalaryExpectationSchema>;

export const JobPreferencesSchema = z.object({
  // Location preferences
  preferredLocations: z.array(z.string()),
  excludedLocations: z.array(z.string()).optional(),
  remotePreference: z.enum([
    "remote-only",
    "remote-preferred",
    "hybrid",
    "on-site",
    "flexible",
  ]),
  willingToRelocate: z.boolean().default(false),
  relocationAssistance: z.boolean().optional(),

  // Employment preferences
  employmentTypes: z.array(
    z.enum(["full-time", "part-time", "contract", "freelance", "internship"])
  ),

  // Salary
  salary: SalaryExpectationSchema,

  // Work preferences
  preferredStartDate: z
    .enum(["immediate", "2-weeks", "1-month", "flexible"])
    .optional(),
  travelWillingness: z
    .enum(["none", "occasional", "frequent", "extensive"])
    .optional(),
  visaSponsorship: z.boolean().optional(),
});

export type JobPreferences = z.infer<typeof JobPreferencesSchema>;

// ============================================
// Advanced Preferences
// ============================================
export const IndustryPreferenceSchema = z.object({
  industry: z.string(),
  interest: z.enum(["preferred", "acceptable", "avoid"]),
});

export type IndustryPreference = z.infer<typeof IndustryPreferenceSchema>;

export const CompanySizePreferenceSchema = z.object({
  size: z.enum(["startup", "small", "medium", "large", "enterprise"]),
  interest: z.enum(["preferred", "acceptable", "avoid"]),
});

export type CompanySizePreference = z.infer<typeof CompanySizePreferenceSchema>;

export const BenefitType = z.enum([
  "health-insurance",
  "dental-vision",
  "401k-matching",
  "stock-options",
  "remote-work",
  "flexible-hours",
  "unlimited-pto",
  "parental-leave",
  "professional-development",
  "gym-membership",
  "free-meals",
  "commuter-benefits",
  "mental-health",
  "childcare",
  "sabbatical",
]);

export const BenefitPrioritySchema = z.object({
  benefit: BenefitType,
  priority: z.enum(["must-have", "nice-to-have", "not-important"]),
});

export type BenefitPriority = z.infer<typeof BenefitPrioritySchema>;

export const SeniorityLevelSchema = z.enum([
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "director",
  "executive",
]);

export type SeniorityLevel = z.infer<typeof SeniorityLevelSchema>;

export const CulturePreferenceSchema = z.enum([
  "fast-paced",
  "work-life-balance",
  "innovative",
  "collaborative",
  "autonomous",
  "mission-driven",
  "growth-focused",
  "stable",
]);

export type CulturePreference = z.infer<typeof CulturePreferenceSchema>;

export const AdvancedPreferencesSchema = z.object({
  // Industry preferences
  industries: z.array(IndustryPreferenceSchema),

  // Company size preferences
  companySizes: z.array(CompanySizePreferenceSchema),

  // Specific companies
  targetCompanies: z.array(z.string()).optional(),
  excludedCompanies: z.array(z.string()).optional(),

  // Benefits priorities
  benefits: z.array(BenefitPrioritySchema),

  // Role preferences
  preferredTitles: z.array(z.string()),
  excludedTitles: z.array(z.string()).optional(),
  seniorityLevel: z.array(SeniorityLevelSchema),

  // Culture preferences
  culturePreferences: z.array(CulturePreferenceSchema).optional(),

  // Deal breakers
  dealBreakers: z.array(z.string()),
});

export type AdvancedPreferences = z.infer<typeof AdvancedPreferencesSchema>;

// ============================================
// CV Metadata
// ============================================
export const CVMetadataSchema = z.object({
  originalFilename: z.string(),
  uploadedAt: z.string().datetime(),
  fileType: z.enum(["pdf", "docx"]),
  fileSize: z.number(),
  extractedAt: z.string().datetime(),
  extractionConfidence: z.number().min(0).max(1).optional(),
});

export type CVMetadata = z.infer<typeof CVMetadataSchema>;

// ============================================
// Generated CV
// ============================================
export const GeneratedCVSchema = z.object({
  id: z.string(),
  templateName: z.string(),
  generatedAt: z.string().datetime(),
  targetJobId: z.string().optional(),
  overleafProjectId: z.string().optional(),
  pdfUrl: z.string().url().optional(),
});

export type GeneratedCV = z.infer<typeof GeneratedCVSchema>;

// ============================================
// Complete User Profile
// ============================================
export const UserProfileSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Core profile data (extracted from CV)
  personalInfo: PersonalInfoSchema,
  workExperience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  skills: SkillsSchema,
  certifications: z.array(CertificationSchema).optional(),
  projects: z.array(ProjectSchema).optional(),

  // User-defined preferences
  jobPreferences: JobPreferencesSchema,
  advancedPreferences: AdvancedPreferencesSchema,

  // CV metadata
  cvMetadata: CVMetadataSchema,

  // Generated CVs
  generatedCVs: z.array(GeneratedCVSchema).optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ============================================
// Job Matching Score
// ============================================
export const JobMatchScoreSchema = z.object({
  jobId: z.string(),
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    skillsMatch: z.number().min(0).max(100),
    experienceMatch: z.number().min(0).max(100),
    locationMatch: z.number().min(0).max(100),
    salaryMatch: z.number().min(0).max(100),
    remoteMatch: z.number().min(0).max(100),
    benefitsMatch: z.number().min(0).max(100),
    industryMatch: z.number().min(0).max(100),
    companySizeMatch: z.number().min(0).max(100),
  }),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  highlights: z.array(z.string()),
  concerns: z.array(z.string()),
});

export type JobMatchScore = z.infer<typeof JobMatchScoreSchema>;

// ============================================
// Partial Profile (for extraction)
// ============================================
export const ExtractedProfileSchema = z.object({
  personalInfo: PersonalInfoSchema.partial(),
  workExperience: z.array(WorkExperienceSchema.partial()).optional(),
  education: z.array(EducationSchema.partial()).optional(),
  skills: SkillsSchema.partial().optional(),
  certifications: z.array(CertificationSchema.partial()).optional(),
  projects: z.array(ProjectSchema.partial()).optional(),
});

export type ExtractedProfile = z.infer<typeof ExtractedProfileSchema>;
