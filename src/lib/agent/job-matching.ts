import { UserProfile } from "@/types/user-profile";
import { EnhancedJobListing, JobMatchResult, MatchScoreBreakdown } from "@/types/jobs";

// ============================================
// Score Weights
// ============================================
const WEIGHTS = {
  skillsMatch: 0.30, // 30% - Most important
  locationMatch: 0.18, // 18%
  salaryMatch: 0.10, // 10%
  seniorityMatch: 0.12, // 12%
  employmentTypeMatch: 0.06, // 6%
  companySizeMatch: 0.05, // 5%
  remoteMatch: 0.04, // 4%
  educationMatch: 0.08, // 8% - NEW: Degree requirements
  experienceMatch: 0.07, // 7% - NEW: Years experience alignment
};

// ============================================
// Education Level Rankings
// ============================================
const EDUCATION_LEVELS: Record<string, number> = {
  "high school": 1,
  "associate": 2,
  "bachelor": 3,
  "master": 4,
  "phd": 5,
  "doctorate": 5,
};

// ============================================
// Prestigious Universities (boost for matching)
// ============================================
const PRESTIGIOUS_UNIVERSITIES = [
  "eth zurich", "eth zürich", "epfl", "mit", "stanford", "berkeley",
  "cambridge", "oxford", "harvard", "caltech", "cmu", "carnegie mellon",
];

// ============================================
// ML/AI Skill Synonyms for Better Matching
// ============================================
const SKILL_SYNONYMS: Record<string, string[]> = {
  "machine learning": ["ml", "machine-learning", "machinelearning", "ai/ml"],
  "deep learning": ["dl", "deep-learning", "deeplearning", "neural networks", "dnn"],
  python: ["py", "python3", "python 3"],
  tensorflow: ["tf", "tensorflow 2", "tf2"],
  pytorch: ["torch", "py torch", "pytorch lightning"],
  "natural language processing": ["nlp", "text processing", "language models", "text analytics"],
  "computer vision": ["cv", "image processing", "vision", "image recognition"],
  kubernetes: ["k8s", "kube", "eks", "gke", "aks"],
  docker: ["containerization", "containers", "dockerfile"],
  aws: ["amazon web services", "amazon aws", "ec2", "s3", "sagemaker"],
  gcp: ["google cloud", "google cloud platform", "vertex ai"],
  azure: ["microsoft azure", "azure ml"],
  sql: ["mysql", "postgresql", "postgres", "sqlite", "database"],
  "large language models": ["llm", "llms", "gpt", "claude", "gemini", "chatgpt", "generative ai"],
  "reinforcement learning": ["rl", "rl algorithms", "reward learning"],
  transformers: ["transformer models", "attention models", "bert", "encoder decoder"],
  langchain: ["lang chain", "langgraph"],
  llamaindex: ["llama index", "llama-index"],
  // Additional ML/AI related
  "data science": ["data scientist", "ds", "analytics"],
  "mlops": ["ml ops", "machine learning operations", "ml engineering"],
  "ai engineer": ["artificial intelligence", "ai developer", "applied ai"],
  "distributed systems": ["distributed computing", "parallel computing", "spark"],
  "slurm": ["job scheduler", "hpc", "cluster computing"],
  react: ["reactjs", "react.js", "react native"],
  nextjs: ["next.js", "next js"],
  typescript: ["ts", "type script"],
  javascript: ["js", "ecmascript", "es6"],
  "hugging face": ["huggingface", "hf", "transformers library"],
  "scikit-learn": ["sklearn", "scikit learn"],
  pandas: ["dataframe", "data manipulation"],
  numpy: ["numerical python", "array computing"],
};

// ============================================
// Seniority Level Mapping
// ============================================
const SENIORITY_ORDER = [
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "director",
  "executive",
] as const;

type SeniorityLevel = typeof SENIORITY_ORDER[number];

// ============================================
// Job Matching Engine
// ============================================
export class JobMatchingEngine {
  private profile: UserProfile;
  private profileSkillsNormalized: Set<string>;

  constructor(profile: UserProfile) {
    this.profile = profile;
    this.profileSkillsNormalized = this.normalizeProfileSkills();
  }

  /**
   * Score a single job against the profile
   */
  scoreJob(job: EnhancedJobListing): JobMatchResult {
    const breakdown = this.calculateBreakdown(job);
    const overallScore = this.calculateOverallScore(breakdown);
    const { matchedSkills, missingSkills } = this.analyzeSkills(job);
    const highlights = this.generateHighlights(job, breakdown);
    const concerns = this.generateConcerns(job, breakdown);

    return {
      jobId: job.id,
      overallScore: Math.round(overallScore),
      breakdown,
      matchedSkills,
      missingSkills,
      highlights,
      concerns,
    };
  }

  /**
   * Score multiple jobs
   */
  scoreJobs(jobs: EnhancedJobListing[]): JobMatchResult[] {
    return jobs.map((job) => this.scoreJob(job));
  }

  /**
   * Calculate individual score components
   */
  private calculateBreakdown(job: EnhancedJobListing): MatchScoreBreakdown {
    return {
      skillsMatch: this.calculateSkillsMatch(job),
      locationMatch: this.calculateLocationMatch(job),
      salaryMatch: this.calculateSalaryMatch(job),
      seniorityMatch: this.calculateSeniorityMatch(job),
      employmentTypeMatch: this.calculateEmploymentTypeMatch(job),
      companySizeMatch: this.calculateCompanySizeMatch(job),
      remoteMatch: this.calculateRemoteMatch(job),
      educationMatch: this.calculateEducationMatch(job),
      experienceMatch: this.calculateExperienceMatch(job),
    };
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(breakdown: MatchScoreBreakdown): number {
    return (
      breakdown.skillsMatch * WEIGHTS.skillsMatch +
      breakdown.locationMatch * WEIGHTS.locationMatch +
      breakdown.salaryMatch * WEIGHTS.salaryMatch +
      breakdown.seniorityMatch * WEIGHTS.seniorityMatch +
      breakdown.employmentTypeMatch * WEIGHTS.employmentTypeMatch +
      breakdown.companySizeMatch * WEIGHTS.companySizeMatch +
      breakdown.remoteMatch * WEIGHTS.remoteMatch +
      (breakdown.educationMatch || 75) * WEIGHTS.educationMatch +
      (breakdown.experienceMatch || 75) * WEIGHTS.experienceMatch
    );
  }

  /**
   * Normalize profile skills for matching
   */
  private normalizeProfileSkills(): Set<string> {
    const skills = new Set<string>();

    for (const skill of this.profile.skills.technical) {
      const normalized = this.normalizeSkillName(skill.name);
      skills.add(normalized);

      // Add synonyms
      for (const [key, synonyms] of Object.entries(SKILL_SYNONYMS)) {
        if (normalized === key || synonyms.includes(normalized)) {
          skills.add(key);
          synonyms.forEach((s) => skills.add(s));
        }
      }
    }

    return skills;
  }

  /**
   * Normalize skill name for comparison
   */
  private normalizeSkillName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
  }

  /**
   * Calculate skills match score
   */
  private calculateSkillsMatch(job: EnhancedJobListing): number {
    // Extract skills from job
    const jobSkills = this.extractJobSkills(job);

    if (jobSkills.length === 0) {
      // No skills listed - give benefit of doubt
      return 70;
    }

    let matchCount = 0;
    let totalWeight = 0;

    for (const jobSkill of jobSkills) {
      const normalized = this.normalizeSkillName(jobSkill);
      const weight = this.getSkillImportance(jobSkill);
      totalWeight += weight;

      if (this.profileSkillsNormalized.has(normalized)) {
        matchCount += weight;
      } else {
        // Check synonyms
        for (const [key, synonyms] of Object.entries(SKILL_SYNONYMS)) {
          if (
            normalized === key ||
            synonyms.includes(normalized)
          ) {
            if (
              this.profileSkillsNormalized.has(key) ||
              synonyms.some((s) => this.profileSkillsNormalized.has(s))
            ) {
              matchCount += weight;
              break;
            }
          }
        }
      }
    }

    if (totalWeight === 0) return 70;
    return Math.min(100, (matchCount / totalWeight) * 100);
  }

  /**
   * Extract skills from job listing
   */
  private extractJobSkills(job: EnhancedJobListing): string[] {
    const skills: string[] = [];

    // From explicit techStack
    if (job.techStack) {
      skills.push(...job.techStack);
    }

    // From requirements
    if (job.requirements) {
      for (const req of job.requirements) {
        // Extract tech keywords from requirements
        const extracted = this.extractTechFromText(req);
        skills.push(...extracted);
      }
    }

    // From description
    if (job.description) {
      const extracted = this.extractTechFromText(job.description);
      skills.push(...extracted);
    }

    // Deduplicate
    return [...new Set(skills)];
  }

  /**
   * Extract technology keywords from text
   */
  private extractTechFromText(text: string): string[] {
    const techKeywords = [
      // Languages
      "python", "java", "javascript", "typescript", "go", "rust", "c\\+\\+", "scala", "r",
      // ML/AI
      "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "pandas", "numpy",
      "machine learning", "deep learning", "neural network", "nlp", "computer vision",
      "llm", "transformers", "hugging face", "langchain", "llamaindex",
      "reinforcement learning", "mlops", "ml engineer",
      // Cloud
      "aws", "gcp", "azure", "kubernetes", "docker", "terraform",
      // Data
      "sql", "postgresql", "mongodb", "spark", "kafka", "airflow",
      // General
      "git", "linux", "agile", "ci/cd",
    ];

    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const keyword of techKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      if (regex.test(lowerText)) {
        found.push(keyword.replace("\\+", "+"));
      }
    }

    return found;
  }

  /**
   * Get importance weight for a skill
   */
  private getSkillImportance(skill: string): number {
    const normalized = this.normalizeSkillName(skill);

    // Core ML skills are more important
    const coreML = ["python", "machine learning", "deep learning", "tensorflow", "pytorch", "llm"];
    if (coreML.some((s) => normalized.includes(s))) {
      return 2;
    }

    // Agentic skills (what user wants)
    const agentic = ["langchain", "llamaindex", "agent", "rag", "llm"];
    if (agentic.some((s) => normalized.includes(s))) {
      return 2;
    }

    return 1;
  }

  /**
   * Calculate location match score
   */
  private calculateLocationMatch(job: EnhancedJobListing): number {
    if (!job.location) return 50; // Unknown location

    const jobLoc = job.location.toLowerCase();
    const preferredLocations = this.profile.jobPreferences?.preferredLocations || [];
    const userLoc = this.profile.personalInfo.location;

    // Check preferred locations
    for (const pref of preferredLocations) {
      if (jobLoc.includes(pref.toLowerCase())) {
        return 100;
      }
    }

    // Check Switzerland (primary target)
    if (
      jobLoc.includes("switzerland") ||
      jobLoc.includes("zurich") ||
      jobLoc.includes("zürich") ||
      jobLoc.includes("geneva") ||
      jobLoc.includes("basel") ||
      jobLoc.includes("bern")
    ) {
      return 95;
    }

    // Remote jobs
    if (job.remote === "remote" || jobLoc.includes("remote")) {
      return 85;
    }

    // Europe (acceptable for career growth)
    const europeCountries = [
      "germany", "france", "netherlands", "uk", "ireland", "austria",
      "belgium", "luxembourg", "sweden", "denmark", "norway", "finland",
    ];
    if (europeCountries.some((c) => jobLoc.includes(c))) {
      return 70;
    }

    // Hybrid with user's location
    if (userLoc?.city && jobLoc.includes(userLoc.city.toLowerCase())) {
      return 90;
    }

    return 40; // Other locations
  }

  /**
   * Calculate salary match score
   */
  private calculateSalaryMatch(job: EnhancedJobListing): number {
    if (!job.salary?.min && !job.salary?.max) {
      return 70; // Unknown salary - neutral
    }

    const salaryPref = this.profile.jobPreferences?.salary;
    if (!salaryPref) {
      return 80; // No preference - assume acceptable
    }

    // Normalize to yearly
    const jobSalaryYearly = this.normalizeToYearlySalary(job.salary);
    const prefMinYearly = salaryPref.minimum;

    if (jobSalaryYearly === null) return 70;

    if (jobSalaryYearly >= prefMinYearly) {
      // Meets or exceeds minimum
      const target = salaryPref.target || prefMinYearly * 1.2;
      if (jobSalaryYearly >= target) {
        return 100;
      }
      // Between min and target
      return 80 + ((jobSalaryYearly - prefMinYearly) / (target - prefMinYearly)) * 20;
    }

    // Below minimum
    const gap = (prefMinYearly - jobSalaryYearly) / prefMinYearly;
    return Math.max(30, 70 - gap * 100);
  }

  /**
   * Normalize salary to yearly amount
   */
  private normalizeToYearlySalary(
    salary: NonNullable<EnhancedJobListing["salary"]>
  ): number | null {
    const amount = salary.max || salary.min;
    if (!amount) return null;

    const period = salary.period || "yearly";
    switch (period) {
      case "hourly":
        return amount * 2080; // 40h/week * 52 weeks
      case "daily":
        return amount * 260; // ~260 working days
      case "monthly":
        return amount * 12;
      case "yearly":
        return amount;
      default:
        return amount;
    }
  }

  /**
   * Calculate seniority match score
   */
  private calculateSeniorityMatch(job: EnhancedJobListing): number {
    const jobSeniority = job.seniorityLevel || this.inferSeniority(job);
    const prefSeniority = this.profile.advancedPreferences?.seniorityLevel || [];

    // For fresh graduates, entry/junior/mid are ideal
    if (prefSeniority.length === 0) {
      // Default for fresh graduate
      if (jobSeniority === "entry" || jobSeniority === "junior") {
        return 100;
      }
      if (jobSeniority === "mid") {
        return 85; // Stretch goal, but achievable
      }
      if (jobSeniority === "senior") {
        return 50; // Might be overqualified requirement
      }
      return 30; // Too senior
    }

    if (prefSeniority.includes(jobSeniority as SeniorityLevel)) {
      return 100;
    }

    // Check if within one level
    const jobIndex = SENIORITY_ORDER.indexOf(jobSeniority as SeniorityLevel);
    for (const pref of prefSeniority) {
      const prefIndex = SENIORITY_ORDER.indexOf(pref);
      const diff = Math.abs(jobIndex - prefIndex);
      if (diff === 1) return 75;
      if (diff === 2) return 50;
    }

    return 30;
  }

  /**
   * Infer seniority from job title/requirements
   */
  private inferSeniority(job: EnhancedJobListing): string {
    const title = job.title.toLowerCase();
    const desc = (job.description || "").toLowerCase();

    if (title.includes("director") || title.includes("head of")) return "director";
    if (title.includes("principal") || title.includes("staff")) return "principal";
    if (title.includes("lead") || title.includes("team lead")) return "lead";
    if (title.includes("senior") || title.includes("sr.")) return "senior";
    if (title.includes("junior") || title.includes("jr.")) return "junior";
    if (title.includes("entry") || title.includes("graduate") || title.includes("intern")) {
      return "entry";
    }

    // Check years of experience in description
    const yearsMatch = desc.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1], 10);
      if (years >= 10) return "principal";
      if (years >= 7) return "lead";
      if (years >= 5) return "senior";
      if (years >= 3) return "mid";
      if (years >= 1) return "junior";
      return "entry";
    }

    return "mid"; // Default assumption
  }

  /**
   * Calculate employment type match
   */
  private calculateEmploymentTypeMatch(job: EnhancedJobListing): number {
    const jobType = job.employmentType || "full-time";
    const prefTypes = this.profile.jobPreferences?.employmentTypes || ["full-time"];

    if (prefTypes.includes(jobType)) {
      return 100;
    }

    // Full-time is usually acceptable
    if (jobType === "full-time") {
      return 80;
    }

    return 40;
  }

  /**
   * Calculate company size match
   * User prefers small/medium companies, slightly out of startup stage
   */
  private calculateCompanySizeMatch(job: EnhancedJobListing): number {
    const jobSize = job.companySize;
    const prefSizes = this.profile.advancedPreferences?.companySizes || [];

    // Default preferences: small > medium > startup > large > enterprise
    if (prefSizes.length === 0) {
      switch (jobSize) {
        case "small":
          return 100;
        case "medium":
          return 95;
        case "startup":
          return 80;
        case "large":
          return 70;
        case "enterprise":
          return 60;
        default:
          return 75; // Unknown
      }
    }

    // Check preferences
    for (const pref of prefSizes) {
      if (pref.size === jobSize) {
        if (pref.interest === "preferred") return 100;
        if (pref.interest === "acceptable") return 75;
        if (pref.interest === "avoid") return 20;
      }
    }

    return 70; // Neutral
  }

  /**
   * Calculate remote match
   */
  private calculateRemoteMatch(job: EnhancedJobListing): number {
    const jobRemote = job.remote || "on-site";
    const prefRemote = this.profile.jobPreferences?.remotePreference || "flexible";

    // Mapping: how well does job match preference
    const matchMatrix: Record<string, Record<string, number>> = {
      "remote-only": { remote: 100, hybrid: 50, "on-site": 10 },
      "remote-preferred": { remote: 100, hybrid: 80, "on-site": 50 },
      hybrid: { remote: 70, hybrid: 100, "on-site": 70 },
      "on-site": { remote: 50, hybrid: 80, "on-site": 100 },
      flexible: { remote: 90, hybrid: 100, "on-site": 85 },
    };

    return matchMatrix[prefRemote]?.[jobRemote] ?? 70;
  }

  /**
   * Calculate education requirements match
   * Considers degree level and prestigious universities
   */
  private calculateEducationMatch(job: EnhancedJobListing): number {
    const desc = (job.description || "").toLowerCase();
    const requirements = (job.requirements || []).join(" ").toLowerCase();
    const combined = `${desc} ${requirements}`;

    // Get user's highest education level
    const userEducation = this.profile.education || [];
    let userLevel = 0;
    let hasPrestigiousUniversity = false;

    for (const edu of userEducation) {
      const level = EDUCATION_LEVELS[edu.degree] || 0;
      if (level > userLevel) userLevel = level;

      // Check for prestigious university
      const institution = edu.institution.toLowerCase();
      if (PRESTIGIOUS_UNIVERSITIES.some(uni => institution.includes(uni))) {
        hasPrestigiousUniversity = true;
      }
    }

    // Detect job's education requirements
    let jobRequiredLevel = 0;

    if (combined.includes("phd") || combined.includes("doctorate")) {
      jobRequiredLevel = 5;
    } else if (combined.includes("master") || combined.includes("msc") || combined.includes("m.s.")) {
      jobRequiredLevel = 4;
    } else if (combined.includes("bachelor") || combined.includes("bsc") || combined.includes("b.s.") || combined.includes("degree")) {
      jobRequiredLevel = 3;
    }

    // No requirements mentioned - neutral
    if (jobRequiredLevel === 0) {
      return hasPrestigiousUniversity ? 85 : 75;
    }

    // User meets or exceeds requirements
    if (userLevel >= jobRequiredLevel) {
      let score = 100;

      // Bonus for prestigious university on competitive roles
      if (hasPrestigiousUniversity && (combined.includes("competitive") || combined.includes("top"))) {
        score = Math.min(100, score + 5);
      }

      return score;
    }

    // User slightly under requirements
    if (userLevel === jobRequiredLevel - 1) {
      // Strong experience might compensate
      return hasPrestigiousUniversity ? 70 : 55;
    }

    // User significantly under-qualified
    return 30;
  }

  /**
   * Calculate experience years alignment
   * More nuanced than seniority - considers actual years required
   */
  private calculateExperienceMatch(job: EnhancedJobListing): number {
    const desc = (job.description || "").toLowerCase();
    const requirements = (job.requirements || []).join(" ").toLowerCase();
    const combined = `${desc} ${requirements}`;

    // Calculate user's total relevant experience (work + education projects)
    const userExperience = this.calculateUserExperienceYears();

    // Extract required years from job
    const yearsPatterns = [
      /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:relevant\s*)?experience/i,
      /minimum\s*(?:of\s*)?(\d+)\s*(?:years?|yrs?)/i,
      /at\s*least\s*(\d+)\s*(?:years?|yrs?)/i,
      /(\d+)-\d+\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i,
    ];

    let requiredYears: number | null = null;
    for (const pattern of yearsPatterns) {
      const match = combined.match(pattern);
      if (match) {
        requiredYears = parseInt(match[1], 10);
        break;
      }
    }

    // No years mentioned - check for level-based hints
    if (requiredYears === null) {
      if (combined.includes("entry level") || combined.includes("graduate") || combined.includes("junior")) {
        requiredYears = 0;
      } else if (combined.includes("senior")) {
        requiredYears = 5;
      } else if (combined.includes("lead") || combined.includes("principal")) {
        requiredYears = 7;
      } else {
        return 75; // No requirement found - neutral
      }
    }

    // Fresh graduate buffer - education counts for ~2 years equivalent
    const effectiveExperience = userExperience + (this.profile.education?.length ? 1 : 0);

    // Calculate score based on gap
    if (effectiveExperience >= requiredYears) {
      return 100;
    }

    const gap = requiredYears - effectiveExperience;

    // 1 year gap - still very possible
    if (gap <= 1) return 85;
    // 2 year gap - stretch but achievable
    if (gap <= 2) return 65;
    // 3+ year gap - significant mismatch
    return Math.max(25, 70 - gap * 15);
  }

  /**
   * Calculate user's relevant work experience in years
   */
  private calculateUserExperienceYears(): number {
    let totalMonths = 0;

    for (const exp of this.profile.workExperience || []) {
      const start = new Date(exp.startDate);
      const end = exp.isCurrent ? new Date() : new Date(exp.endDate || new Date());

      const months = (end.getFullYear() - start.getFullYear()) * 12 +
                     (end.getMonth() - start.getMonth());

      // Weight internships at 50% since they're learning experiences
      const weight = exp.employmentType === "internship" ? 0.5 : 1;
      totalMonths += months * weight;
    }

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
  }

  /**
   * Analyze which skills match/missing
   */
  private analyzeSkills(
    job: EnhancedJobListing
  ): { matchedSkills: string[]; missingSkills: string[] } {
    const jobSkills = this.extractJobSkills(job);
    const matched: string[] = [];
    const missing: string[] = [];

    for (const skill of jobSkills) {
      const normalized = this.normalizeSkillName(skill);
      let found = this.profileSkillsNormalized.has(normalized);

      if (!found) {
        // Check synonyms
        for (const [key, synonyms] of Object.entries(SKILL_SYNONYMS)) {
          if (normalized === key || synonyms.includes(normalized)) {
            if (
              this.profileSkillsNormalized.has(key) ||
              synonyms.some((s) => this.profileSkillsNormalized.has(s))
            ) {
              found = true;
              break;
            }
          }
        }
      }

      if (found) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }

    return { matchedSkills: matched, missingSkills: missing };
  }

  /**
   * Generate positive highlights
   */
  private generateHighlights(
    job: EnhancedJobListing,
    breakdown: MatchScoreBreakdown
  ): string[] {
    const highlights: string[] = [];

    if (breakdown.skillsMatch >= 80) {
      highlights.push("Strong skills match");
    }

    if (breakdown.locationMatch >= 90) {
      highlights.push("Ideal location");
    } else if (job.remote === "remote") {
      highlights.push("Remote position available");
    }

    if (breakdown.seniorityMatch >= 90) {
      highlights.push("Perfect seniority level");
    }

    if (breakdown.companySizeMatch >= 90) {
      highlights.push("Preferred company size");
    }

    // Check for ML/AI focus
    const title = job.title.toLowerCase();
    if (
      title.includes("machine learning") ||
      title.includes("ml") ||
      title.includes("ai") ||
      title.includes("llm")
    ) {
      highlights.push("ML/AI focused role");
    }

    // Check for agentic keywords
    const desc = (job.description || "").toLowerCase();
    if (
      desc.includes("agent") ||
      desc.includes("langchain") ||
      desc.includes("agentic") ||
      desc.includes("llm")
    ) {
      highlights.push("Involves agentic/LLM work");
    }

    return highlights;
  }

  /**
   * Generate concerns/flags
   */
  private generateConcerns(
    job: EnhancedJobListing,
    breakdown: MatchScoreBreakdown
  ): string[] {
    const concerns: string[] = [];

    if (breakdown.skillsMatch < 50) {
      concerns.push("Missing many required skills");
    }

    if (breakdown.seniorityMatch < 50) {
      concerns.push("Seniority level mismatch");
    }

    if (breakdown.locationMatch < 50 && job.remote !== "remote") {
      concerns.push("Location not ideal");
    }

    if (breakdown.salaryMatch < 50) {
      concerns.push("Salary below expectations");
    }

    // Check for senior-only roles
    const desc = (job.description || "").toLowerCase();
    const yearsMatch = desc.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i);
    if (yearsMatch && parseInt(yearsMatch[1], 10) >= 5) {
      concerns.push(`Requires ${yearsMatch[1]}+ years experience`);
    }

    return concerns;
  }
}

/**
 * Score jobs against a profile
 */
export function scoreJobsAgainstProfile(
  profile: UserProfile,
  jobs: EnhancedJobListing[]
): JobMatchResult[] {
  const engine = new JobMatchingEngine(profile);
  return engine.scoreJobs(jobs);
}

/**
 * Score a single job
 */
export function scoreJobAgainstProfile(
  profile: UserProfile,
  job: EnhancedJobListing
): JobMatchResult {
  const engine = new JobMatchingEngine(profile);
  return engine.scoreJob(job);
}
