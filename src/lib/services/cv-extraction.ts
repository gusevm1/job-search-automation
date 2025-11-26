import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import type { ExtractedProfile } from "@/types/user-profile";

// Lazy-load the Anthropic client to ensure env vars are loaded first
let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

/**
 * Extract text content from a PDF file
 */
export async function extractPDFText(filePath: string): Promise<string> {
  // Use pdf-parse/lib/pdf-parse to avoid test file loading issue
  const pdfParse = (await import("pdf-parse/lib/pdf-parse")).default;
  const dataBuffer = await readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * The extraction prompt for parsing CV content
 */
const EXTRACTION_PROMPT = `You are a CV/Resume parser. Extract structured profile data from the following CV text content.

Analyze the text carefully and extract:

1. **Personal Information**:
   - firstName, lastName (split the full name)
   - email address
   - phone number
   - location (city, state/region, country)
   - LinkedIn URL (if present)
   - GitHub URL (if present)
   - Portfolio/website URL (if present)
   - Professional summary (if present)

2. **Work Experience** (for each position):
   - id (generate a unique ID like "exp_1", "exp_2", etc.)
   - title (job title)
   - company (company name)
   - industry (infer from company/role if possible)
   - location (job location)
   - remote ("remote", "hybrid", or "on-site" - infer if mentioned)
   - startDate (YYYY-MM format)
   - endDate (YYYY-MM format, or null if current position)
   - isCurrent (true if this is their current job)
   - responsibilities (array of bullet points)
   - achievements (array of {description, metric} objects - include quantified achievements)
   - skillsUsed (array of technologies/skills mentioned)
   - employmentType ("full-time", "part-time", "contract", "freelance", or "internship")

3. **Education** (for each entry):
   - id (generate like "edu_1", "edu_2", etc.)
   - institution (school/university name)
   - degree ("bachelor", "master", "doctorate", "associate", "certificate", "bootcamp", "high-school")
   - field (field of study)
   - startDate (YYYY-MM if available)
   - graduationDate (YYYY-MM if available)
   - gpa (if mentioned, as a number 0-4)
   - honors (if mentioned)
   - relevantCoursework (array if mentioned)

4. **Skills**:
   - technical: array of {name, category, proficiency, yearsOfExperience}
     - category: "language", "framework", "database", "cloud", "devops", "tool", or "other"
     - proficiency: estimate as "beginner", "intermediate", "advanced", or "expert" based on context
   - soft: array of {name, proficiency} for soft skills
   - languages: array of {language, proficiency} for spoken languages
     - proficiency: "elementary", "limited-working", "professional-working", "full-professional", or "native"

5. **Certifications** (if any):
   - id (generate like "cert_1", etc.)
   - name
   - issuer
   - issueDate (YYYY-MM)
   - expirationDate (if applicable)
   - credentialId (if mentioned)
   - credentialUrl (if mentioned)

6. **Projects** (if any):
   - id (generate like "proj_1", etc.)
   - name
   - description
   - url (if mentioned)
   - repoUrl (if mentioned)
   - technologies (array)
   - highlights (array of key achievements/features)

Return ONLY valid JSON matching this TypeScript interface (no markdown, no explanation):

{
  "personalInfo": {
    "firstName": string,
    "lastName": string,
    "email": string,
    "phone"?: string,
    "location": {
      "city"?: string,
      "state"?: string,
      "country": string,
      "willingToRelocate": false
    },
    "linkedIn"?: string,
    "github"?: string,
    "portfolio"?: string,
    "summary"?: string
  },
  "workExperience": [...],
  "education": [...],
  "skills": {
    "technical": [...],
    "soft": [...],
    "languages": [...]
  },
  "certifications"?: [...],
  "projects"?: [...]
}

CV TEXT CONTENT:
`;

/**
 * Use Claude to extract structured data from CV text
 */
export async function extractProfileFromText(
  cvText: string
): Promise<ExtractedProfile> {
  const message = await getAnthropicClient().messages.create({
    model: "claude-3-5-haiku-20241022", // Using Haiku for cost efficiency (~10x cheaper than Sonnet)
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: EXTRACTION_PROMPT + cvText,
      },
    ],
  });

  // Extract the text content from the response
  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse the JSON response
  try {
    // Try to extract JSON from the response (in case there's any extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const parsed = JSON.parse(jsonMatch[0]);

    // Normalize the extracted data to handle common issues
    const normalized = normalizeExtractedProfile(parsed);

    return normalized as ExtractedProfile;
  } catch (error) {
    console.error("Failed to parse extraction response:", responseText);
    throw new Error(
      `Failed to parse CV extraction response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Normalize extracted profile data to handle common extraction issues
 */
function normalizeExtractedProfile(data: Record<string, unknown>): Record<string, unknown> {
  // Normalize employment types
  const validEmploymentTypes = ["full-time", "part-time", "contract", "freelance", "internship"];

  if (data.workExperience && Array.isArray(data.workExperience)) {
    data.workExperience = data.workExperience.map((exp: Record<string, unknown>) => {
      // Normalize employmentType
      if (exp.employmentType) {
        const normalized = String(exp.employmentType).toLowerCase().replace(/\s+/g, "-");
        if (!validEmploymentTypes.includes(normalized)) {
          // Try to map common variations
          if (normalized.includes("full") || normalized.includes("permanent")) {
            exp.employmentType = "full-time";
          } else if (normalized.includes("part")) {
            exp.employmentType = "part-time";
          } else if (normalized.includes("intern")) {
            exp.employmentType = "internship";
          } else if (normalized.includes("contract") || normalized.includes("temp")) {
            exp.employmentType = "contract";
          } else if (normalized.includes("freelance") || normalized.includes("self")) {
            exp.employmentType = "freelance";
          } else {
            // Default to full-time if unknown
            exp.employmentType = "full-time";
          }
        } else {
          exp.employmentType = normalized;
        }
      }

      // Ensure achievements have proper structure
      if (exp.achievements && Array.isArray(exp.achievements)) {
        exp.achievements = exp.achievements.map((ach: Record<string, unknown>) => ({
          description: ach.description || "",
          metric: ach.metric || null,
        }));
      }

      return exp;
    });
  }

  // Normalize remote work values
  const validRemoteTypes = ["remote", "hybrid", "on-site"];
  if (data.workExperience && Array.isArray(data.workExperience)) {
    data.workExperience = data.workExperience.map((exp: Record<string, unknown>) => {
      if (exp.remote) {
        const normalized = String(exp.remote).toLowerCase().replace(/\s+/g, "-");
        if (!validRemoteTypes.includes(normalized)) {
          if (normalized.includes("remote")) {
            exp.remote = "remote";
          } else if (normalized.includes("hybrid")) {
            exp.remote = "hybrid";
          } else {
            exp.remote = "on-site";
          }
        } else {
          exp.remote = normalized;
        }
      }
      return exp;
    });
  }

  return data;
}

/**
 * Full extraction pipeline: PDF -> Text -> Structured Profile
 */
export async function extractProfileFromPDF(
  filePath: string
): Promise<ExtractedProfile> {
  // Step 1: Extract text from PDF
  const cvText = await extractPDFText(filePath);

  if (!cvText || cvText.trim().length < 50) {
    throw new Error(
      "Could not extract sufficient text from PDF. The file may be scanned/image-based."
    );
  }

  // Step 2: Use Claude to parse the text into structured data
  const profile = await extractProfileFromText(cvText);

  return profile;
}
