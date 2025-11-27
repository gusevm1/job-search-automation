import { UserProfile, TechnicalSkill, SkillProficiency } from "@/types/user-profile";
import { SearchQuery, ProfileAnalysis } from "@/types/jobs";

// ============================================
// Job Board Configurations
// ============================================
export interface JobBoardInfo {
  id: string;
  name: string;
  baseUrl: string;
  regions: string[];
  specialization: "tech" | "general" | "startup";
  rateLimit: number; // requests per minute
  buildSearchUrl: (query: string, location?: string) => string;
}

export const JOB_BOARDS: JobBoardInfo[] = [
  // Swiss Tech-Focused Boards (Priority for ML/AI roles)
  {
    id: "swissdevjobs",
    name: "SwissDevJobs",
    baseUrl: "https://swissdevjobs.ch",
    regions: ["CH"],
    specialization: "tech",
    rateLimit: 5,
    buildSearchUrl: (query, location) => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      return `https://swissdevjobs.ch/jobs?${params.toString()}`;
    },
  },
  {
    id: "datacareer",
    name: "Datacareer.ch",
    baseUrl: "https://www.datacareer.ch",
    regions: ["CH"],
    specialization: "tech",
    rateLimit: 5,
    buildSearchUrl: (query, location) => {
      return `https://www.datacareer.ch/categories/AI/`;
    },
  },
  // International Aggregators - WORKING
  {
    id: "indeed",
    name: "Indeed CH",
    baseUrl: "https://ch.indeed.com",
    regions: ["CH", "Global"],
    specialization: "general",
    rateLimit: 5,
    buildSearchUrl: (query, location) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("l", location || "Switzerland");
      return `https://ch.indeed.com/jobs?${params.toString()}`;
    },
  },
  {
    id: "glassdoor",
    name: "Glassdoor",
    baseUrl: "https://www.glassdoor.com",
    regions: ["CH", "Global"],
    specialization: "general",
    rateLimit: 5,
    buildSearchUrl: (query, location) => {
      const searchQuery = encodeURIComponent(query || "").replace(/%20/g, "-").toLowerCase();
      return `https://www.glassdoor.com/Job/switzerland-${searchQuery}-jobs-SRCH_IL.0,11_IN226_KO12,${12 + searchQuery.length}.htm`;
    },
  },
  // LIMITED RESULTS - Jobs.ch only extracts first page due to JS rendering
  {
    id: "jobs.ch",
    name: "Jobs.ch",
    baseUrl: "https://www.jobs.ch",
    regions: ["CH"],
    specialization: "general",
    rateLimit: 5,
    buildSearchUrl: (query, location) => {
      const params = new URLSearchParams();
      if (query) params.set("term", query);
      if (location) params.set("location", location);
      return `https://www.jobs.ch/en/vacancies/?${params.toString()}`;
    },
  },
  // Additional Swiss Job Boards
  {
    id: "jobup",
    name: "Jobup.ch",
    baseUrl: "https://www.jobup.ch",
    regions: ["CH"],
    specialization: "general",
    rateLimit: 5,
    buildSearchUrl: (query, location) => {
      const params = new URLSearchParams();
      if (query) params.set("term", query);
      return `https://www.jobup.ch/en/jobs/?${params.toString()}`;
    },
  },
  {
    id: "jobscout24",
    name: "Jobscout24.ch",
    baseUrl: "https://www.jobscout24.ch",
    regions: ["CH"],
    specialization: "general",
    rateLimit: 5,
    buildSearchUrl: (query, location) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      return `https://www.jobscout24.ch/en/jobs/?${params.toString()}`;
    },
  },
  // DISABLED BOARDS:
  // - ictjobs: Requires JS interaction for search
  // - linkedin: Requires Firecrawl Enterprise
];

// ============================================
// Proficiency Weight
// ============================================
const PROFICIENCY_WEIGHTS: Record<SkillProficiency, number> = {
  expert: 10,
  advanced: 8,
  intermediate: 5,
  beginner: 2,
};

// ============================================
// ML/AI Related Keywords for Query Enhancement
// ============================================
const ML_KEYWORDS = [
  "machine learning",
  "deep learning",
  "AI",
  "artificial intelligence",
  "neural networks",
  "NLP",
  "computer vision",
  "LLM",
  "large language models",
  "transformers",
  "reinforcement learning",
  "MLOps",
  "ML engineer",
  "AI engineer",
  "data scientist",
];

const AGENTIC_KEYWORDS = [
  "agentic",
  "AI agent",
  "autonomous agent",
  "LLM agent",
  "AI automation",
  "intelligent automation",
  "workflow automation",
  "RAG",
  "retrieval augmented",
  "langchain",
  "llamaindex",
];

// ============================================
// Profile Analyzer Class
// ============================================
export class ProfileAnalyzer {
  private profile: UserProfile;

  constructor(profile: UserProfile) {
    this.profile = profile;
  }

  /**
   * Analyze profile and generate comprehensive search strategy
   */
  analyze(): ProfileAnalysis {
    const topSkills = this.extractTopSkills();
    const targetTitles = this.generateTargetTitles();
    const locations = this.extractLocations();
    const queries = this.generateSearchQueries(topSkills, targetTitles, locations);
    const boardPriorities = this.prioritizeBoards(locations);
    const companyPreferences = this.extractCompanyPreferences();

    return {
      queries,
      boardPriorities,
      topSkills,
      targetTitles,
      locations,
      companyPreferences,
    };
  }

  /**
   * Extract and rank top skills by proficiency
   */
  private extractTopSkills(): string[] {
    const technicalSkills = this.profile.skills.technical;

    // Sort by proficiency weight, then by years of experience
    const ranked = [...technicalSkills].sort((a, b) => {
      const weightA = PROFICIENCY_WEIGHTS[a.proficiency];
      const weightB = PROFICIENCY_WEIGHTS[b.proficiency];

      if (weightA !== weightB) return weightB - weightA;

      // Secondary sort by years
      const yearsA = a.yearsOfExperience || 0;
      const yearsB = b.yearsOfExperience || 0;
      return yearsB - yearsA;
    });

    // Return top skills (limit to most relevant)
    return ranked.slice(0, 15).map((s) => s.name);
  }

  /**
   * Generate target job titles based on profile
   */
  private generateTargetTitles(): string[] {
    const titles: string[] = [];

    // Use preferred titles from profile if available
    if (this.profile.advancedPreferences?.preferredTitles) {
      titles.push(...this.profile.advancedPreferences.preferredTitles);
    }

    // Infer titles from work experience
    for (const exp of this.profile.workExperience.slice(0, 3)) {
      if (!titles.includes(exp.title)) {
        titles.push(exp.title);
      }
    }

    // Add ML/AI specific titles based on skills
    const hasMLSkills = this.profile.skills.technical.some((s) =>
      ML_KEYWORDS.some((kw) => s.name.toLowerCase().includes(kw.toLowerCase()))
    );

    if (hasMLSkills || titles.length === 0) {
      // Add ML-relevant titles for fresh graduates
      const mlTitles = [
        "Machine Learning Engineer",
        "AI Engineer",
        "ML Engineer",
        "Applied ML Engineer",
        "AI/ML Engineer",
        "Data Scientist",
        "Research Engineer",
        "Applied Scientist",
      ];

      for (const title of mlTitles) {
        if (!titles.includes(title)) {
          titles.push(title);
        }
      }
    }

    return titles.slice(0, 10);
  }

  /**
   * Extract location preferences
   */
  private extractLocations(): string[] {
    const locations: string[] = [];

    // Primary: job preferences
    if (this.profile.jobPreferences?.preferredLocations) {
      locations.push(...this.profile.jobPreferences.preferredLocations);
    }

    // Current location as fallback
    if (this.profile.personalInfo.location) {
      const loc = this.profile.personalInfo.location;
      if (loc.city && !locations.includes(loc.city)) {
        locations.push(loc.city);
      }
      if (loc.country && !locations.includes(loc.country)) {
        locations.push(loc.country);
      }
    }

    // Add Zurich/Switzerland defaults for Swiss job search
    if (!locations.some((l) => l.toLowerCase().includes("zurich"))) {
      locations.push("Zurich");
    }
    if (!locations.some((l) => l.toLowerCase().includes("switzerland"))) {
      locations.push("Switzerland");
    }

    return locations;
  }

  /**
   * Generate search queries from profile data
   * Prioritizes AI-generated keywords if available
   */
  private generateSearchQueries(
    topSkills: string[],
    targetTitles: string[],
    locations: string[]
  ): SearchQuery[] {
    const queries: SearchQuery[] = [];
    const primaryLocation = locations[0] || "Switzerland";

    // Check if user has keywords (AI-generated or manual) - these take priority
    const aiKeywords = this.profile.jobSearchConfig?.generatedKeywords || [];
    const manualKeywords = this.profile.jobSearchConfig?.manualKeywords || [];

    // Combine and deduplicate keywords (manual keywords first as they're user-specified)
    const allKeywords = [...new Set([...manualKeywords, ...aiKeywords])];

    if (allKeywords.length > 0) {
      console.log(`[ProfileAnalyzer] Using ${allKeywords.length} keywords (${manualKeywords.length} manual, ${aiKeywords.length} AI-generated)`);

      // All keywords get highest priority
      for (const keyword of allKeywords) {
        queries.push({
          query: keyword,
          location: primaryLocation,
          priority: 10,
          category: manualKeywords.includes(keyword) ? "manual" : "ai_generated",
        });
      }

      // Also add without location for broader search (top 3)
      for (const keyword of allKeywords.slice(0, 3)) {
        queries.push({
          query: keyword,
          location: undefined,
          priority: 9,
          category: "global",
        });
      }

      // Add remote variations for top keywords (top 2)
      for (const keyword of allKeywords.slice(0, 2)) {
        queries.push({
          query: `${keyword} Remote`,
          location: undefined,
          remote: true,
          priority: 8,
          category: "remote",
        });
      }

      // Sort by priority and return
      return queries.sort((a, b) => b.priority - a.priority);
    }

    // Fallback to original logic if no AI keywords
    console.log("[ProfileAnalyzer] No AI keywords, using profile-based generation");

    // 1. Title-based queries (highest priority)
    for (const title of targetTitles.slice(0, 5)) {
      queries.push({
        query: title,
        location: primaryLocation,
        priority: 10,
        category: "title",
      });
    }

    // 2. Skill-based queries for top skills
    for (const skill of topSkills.slice(0, 5)) {
      queries.push({
        query: skill,
        location: primaryLocation,
        priority: 8,
        category: "primary_skill",
      });
    }

    // 3. Combination queries (title + key technology)
    const techCategories = this.groupSkillsByCategory();
    const frameworks = techCategories.get("framework") || [];

    // ML + Framework combinations
    for (const fw of frameworks.slice(0, 3)) {
      queries.push({
        query: `${fw} Machine Learning`,
        location: primaryLocation,
        priority: 9,
        category: "combination",
      });
    }

    // 4. Agentic/LLM specific queries (for applied agentic workflows)
    const agenticQueries = [
      "AI Agent Developer",
      "LLM Engineer",
      "Applied AI Engineer",
      "Agentic AI",
      "LangChain Developer",
      "AI Automation Engineer",
      "Generative AI Engineer",
    ];

    for (const aq of agenticQueries) {
      queries.push({
        query: aq,
        location: primaryLocation,
        priority: 9,
        category: "agentic",
      });
    }

    // 5. Remote queries (for international opportunities)
    queries.push({
      query: "Machine Learning Engineer Remote",
      location: undefined,
      remote: true,
      priority: 7,
      category: "remote",
    });

    queries.push({
      query: "AI Engineer Remote Europe",
      location: undefined,
      remote: true,
      priority: 7,
      category: "remote",
    });

    // 6. Secondary skills
    for (const skill of topSkills.slice(5, 10)) {
      queries.push({
        query: skill,
        location: primaryLocation,
        priority: 5,
        category: "secondary_skill",
      });
    }

    // Sort by priority
    return queries.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Group skills by category
   */
  private groupSkillsByCategory(): Map<string, string[]> {
    const groups = new Map<string, string[]>();

    for (const skill of this.profile.skills.technical) {
      const category = skill.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(skill.name);
    }

    return groups;
  }

  /**
   * Prioritize job boards based on profile
   */
  private prioritizeBoards(
    locations: string[]
  ): ProfileAnalysis["boardPriorities"] {
    const priorities: ProfileAnalysis["boardPriorities"] = [];
    const isSwissFocused = locations.some(
      (l) =>
        l.toLowerCase().includes("switzerland") ||
        l.toLowerCase().includes("zurich") ||
        l.toLowerCase().includes("geneva") ||
        l.toLowerCase().includes("basel")
    );

    for (const board of JOB_BOARDS) {
      let priority = 5;
      let reason = "Standard priority";

      // Swiss-focused boards get higher priority for Swiss searches
      if (isSwissFocused && board.regions.includes("CH")) {
        priority = board.specialization === "tech" ? 10 : 8;
        reason = "Swiss-focused board, matches location preference";
      }

      // Tech-specialized boards get bonus for tech profiles
      if (board.specialization === "tech") {
        priority += 1;
        reason += "; Tech-specialized board";
      }

      // Global boards for international opportunities
      if (board.regions.includes("Global")) {
        priority = isSwissFocused ? 6 : 8;
        reason = isSwissFocused
          ? "Global board for additional opportunities"
          : "Primary board for global search";
      }

      priorities.push({
        boardId: board.id,
        priority,
        reason: reason.replace(/^; /, ""),
      });
    }

    return priorities.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Extract company preferences from profile
   */
  private extractCompanyPreferences(): ProfileAnalysis["companyPreferences"] {
    const sizes: string[] = [];
    const industries: string[] = [];

    // From advanced preferences
    if (this.profile.advancedPreferences?.companySizes) {
      for (const pref of this.profile.advancedPreferences.companySizes) {
        if (pref.interest === "preferred" || pref.interest === "acceptable") {
          sizes.push(pref.size);
        }
      }
    }

    if (this.profile.advancedPreferences?.industries) {
      for (const pref of this.profile.advancedPreferences.industries) {
        if (pref.interest === "preferred" || pref.interest === "acceptable") {
          industries.push(pref.industry);
        }
      }
    }

    // Default preferences for ML roles
    if (sizes.length === 0) {
      sizes.push("small", "medium", "startup"); // User prefers smaller companies
    }

    if (industries.length === 0) {
      industries.push(
        "Technology",
        "AI/ML",
        "Software",
        "FinTech",
        "HealthTech",
        "Research"
      );
    }

    return { sizes, industries };
  }
}

/**
 * Analyze a user profile and generate search strategy
 */
export function analyzeProfile(profile: UserProfile): ProfileAnalysis {
  const analyzer = new ProfileAnalyzer(profile);
  return analyzer.analyze();
}

/**
 * Get job board by ID
 */
export function getJobBoard(boardId: string): JobBoardInfo | undefined {
  return JOB_BOARDS.find((b) => b.id === boardId);
}

/**
 * Get all enabled job boards
 */
export function getEnabledJobBoards(): JobBoardInfo[] {
  return JOB_BOARDS;
}
