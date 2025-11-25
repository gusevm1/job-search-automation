import { promises as fs } from "fs";
import path from "path";
import {
  UserProfile,
  UserProfileSchema,
  ExtractedProfile,
} from "@/types/user-profile";

const DATA_DIR = path.join(process.cwd(), "src/lib/data");
const PROFILES_DIR = path.join(DATA_DIR, "profiles");
const CVS_DIR = path.join(DATA_DIR, "cvs");
const INDEX_FILE = path.join(DATA_DIR, "index.json");

interface ProfileIndex {
  profiles: {
    id: string;
    email: string;
    name: string;
    updatedAt: string;
  }[];
  lastUpdated: string;
}

/**
 * Ensure data directories exist
 */
export async function ensureDataDirs(): Promise<void> {
  await fs.mkdir(PROFILES_DIR, { recursive: true });
  await fs.mkdir(CVS_DIR, { recursive: true });
}

/**
 * Get the file path for a user profile
 */
function getProfilePath(userId: string): string {
  return path.join(PROFILES_DIR, `${userId}.json`);
}

/**
 * Get the directory for a user's CVs
 */
export function getUserCVDir(userId: string): string {
  return path.join(CVS_DIR, userId);
}

/**
 * Load the profile index
 */
export async function loadIndex(): Promise<ProfileIndex> {
  try {
    const data = await fs.readFile(INDEX_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { profiles: [], lastUpdated: new Date().toISOString() };
  }
}

/**
 * Save the profile index
 */
async function saveIndex(index: ProfileIndex): Promise<void> {
  await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), "utf-8");
}

/**
 * Get a user profile by ID
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  try {
    const filepath = getProfilePath(userId);
    const data = await fs.readFile(filepath, "utf-8");
    const parsed = JSON.parse(data);
    return UserProfileSchema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * Save a user profile
 */
export async function saveProfile(profile: UserProfile): Promise<void> {
  await ensureDataDirs();

  // Validate
  const validated = UserProfileSchema.parse(profile);
  validated.updatedAt = new Date().toISOString();

  // Save profile
  const filepath = getProfilePath(profile.id);
  await fs.writeFile(filepath, JSON.stringify(validated, null, 2), "utf-8");

  // Update index
  const index = await loadIndex();
  const existingIdx = index.profiles.findIndex((p) => p.id === profile.id);
  const indexEntry = {
    id: profile.id,
    email: profile.personalInfo.email,
    name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
    updatedAt: validated.updatedAt,
  };

  if (existingIdx >= 0) {
    index.profiles[existingIdx] = indexEntry;
  } else {
    index.profiles.push(indexEntry);
  }
  index.lastUpdated = new Date().toISOString();

  await saveIndex(index);
}

/**
 * Delete a user profile
 */
export async function deleteProfile(userId: string): Promise<boolean> {
  try {
    const filepath = getProfilePath(userId);
    await fs.unlink(filepath);

    // Update index
    const index = await loadIndex();
    index.profiles = index.profiles.filter((p) => p.id !== userId);
    index.lastUpdated = new Date().toISOString();
    await saveIndex(index);

    return true;
  } catch {
    return false;
  }
}

/**
 * List all profiles (from index)
 */
export async function listProfiles(): Promise<ProfileIndex["profiles"]> {
  const index = await loadIndex();
  return index.profiles;
}

/**
 * Check if a profile exists
 */
export async function profileExists(userId: string): Promise<boolean> {
  try {
    await fs.access(getProfilePath(userId));
    return true;
  } catch {
    return false;
  }
}

/**
 * Save uploaded CV file
 */
export async function saveUploadedCV(
  userId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const userCVDir = path.join(getUserCVDir(userId), "original");
  await fs.mkdir(userCVDir, { recursive: true });

  const filepath = path.join(userCVDir, filename);
  await fs.writeFile(filepath, buffer);

  return filepath;
}

/**
 * Get the path to a user's original CV
 */
export async function getOriginalCVPath(
  userId: string
): Promise<string | null> {
  const userCVDir = path.join(getUserCVDir(userId), "original");

  try {
    const files = await fs.readdir(userCVDir);
    if (files.length > 0) {
      return path.join(userCVDir, files[0]);
    }
  } catch {
    // Directory doesn't exist
  }

  return null;
}

/**
 * Save generated CV
 */
export async function saveGeneratedCV(
  userId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const generatedDir = path.join(getUserCVDir(userId), "generated");
  await fs.mkdir(generatedDir, { recursive: true });

  const filepath = path.join(generatedDir, filename);
  await fs.writeFile(filepath, buffer);

  return filepath;
}

/**
 * Create a new profile from extracted CV data
 */
export function createProfileFromExtraction(
  userId: string,
  extracted: ExtractedProfile,
  cvMetadata: {
    originalFilename: string;
    fileType: "pdf" | "docx";
    fileSize: number;
  }
): Partial<UserProfile> {
  const now = new Date().toISOString();

  return {
    id: userId,
    createdAt: now,
    updatedAt: now,
    personalInfo: extracted.personalInfo as UserProfile["personalInfo"],
    workExperience: (extracted.workExperience ||
      []) as UserProfile["workExperience"],
    education: (extracted.education || []) as UserProfile["education"],
    skills: (extracted.skills || {
      technical: [],
      soft: [],
      languages: [],
    }) as UserProfile["skills"],
    certifications: extracted.certifications as UserProfile["certifications"],
    projects: extracted.projects as UserProfile["projects"],
    cvMetadata: {
      ...cvMetadata,
      uploadedAt: now,
      extractedAt: now,
    },
  };
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
