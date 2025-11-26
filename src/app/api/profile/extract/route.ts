import { NextRequest, NextResponse } from "next/server";
import { extractProfileFromPDF } from "@/lib/services/cv-extraction";
import {
  getOriginalCVPath,
  saveProfile,
  getProfile,
  createProfileFromExtraction,
} from "@/lib/data/profile-store";
import type { UserProfile, JobPreferences, AdvancedPreferences } from "@/types/user-profile";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the path to the uploaded CV
    const cvPath = await getOriginalCVPath(userId);
    if (!cvPath) {
      return NextResponse.json(
        { success: false, message: "No CV found for this user" },
        { status: 404 }
      );
    }

    // Extract profile from PDF
    const extractedProfile = await extractProfileFromPDF(cvPath);

    // Get existing profile if any, or create new one
    let existingProfile = await getProfile(userId);

    // Create default preferences if this is a new profile
    const defaultJobPreferences: JobPreferences = {
      preferredLocations: [],
      remotePreference: "flexible",
      employmentTypes: ["full-time"],
      salary: {
        minimum: 0,
        currency: "USD",
        period: "yearly",
        negotiable: true,
      },
      willingToRelocate: false,
    };

    const defaultAdvancedPreferences: AdvancedPreferences = {
      industries: [],
      companySizes: [],
      benefits: [],
      preferredTitles: [],
      seniorityLevel: ["mid"],
      dealBreakers: [],
    };

    // Merge extracted data with existing profile or create new
    const now = new Date().toISOString();
    const fileType = cvPath.endsWith(".pdf") ? "pdf" : "docx";

    const updatedProfile: UserProfile = {
      id: userId,
      createdAt: existingProfile?.createdAt || now,
      updatedAt: now,
      personalInfo: {
        ...extractedProfile.personalInfo,
        firstName: extractedProfile.personalInfo?.firstName || "",
        lastName: extractedProfile.personalInfo?.lastName || "",
        email: extractedProfile.personalInfo?.email || "",
        location: extractedProfile.personalInfo?.location
          ? { ...extractedProfile.personalInfo.location, willingToRelocate: extractedProfile.personalInfo.location.willingToRelocate ?? false }
          : { country: "Unknown", willingToRelocate: false },
      },
      workExperience: (extractedProfile.workExperience || []).map((exp, i) => ({
        ...exp,
        id: exp.id || `exp_${i + 1}`,
        title: exp.title || "",
        company: exp.company || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate ?? null,
        isCurrent: exp.isCurrent ?? false,
        responsibilities: exp.responsibilities || [],
        achievements: exp.achievements || [],
        skillsUsed: exp.skillsUsed || [],
        employmentType: exp.employmentType || "full-time",
      })),
      education: (extractedProfile.education || []).map((edu, i) => ({
        ...edu,
        id: edu.id || `edu_${i + 1}`,
        institution: edu.institution || "",
        degree: edu.degree || "bachelor",
        field: edu.field || "",
      })),
      skills: {
        technical: extractedProfile.skills?.technical || [],
        soft: extractedProfile.skills?.soft || [],
        languages: extractedProfile.skills?.languages || [],
      },
      certifications: extractedProfile.certifications?.map((cert, i) => ({
        id: cert.id || `cert_${i + 1}`,
        name: cert.name || "",
        issuer: cert.issuer || "",
        issueDate: cert.issueDate || "",
        expirationDate: cert.expirationDate,
        credentialId: cert.credentialId,
        credentialUrl: cert.credentialUrl,
      })),
      projects: extractedProfile.projects?.map((proj, i) => ({
        id: proj.id || `proj_${i + 1}`,
        name: proj.name || "",
        description: proj.description || "",
        url: proj.url,
        repoUrl: proj.repoUrl,
        startDate: proj.startDate,
        endDate: proj.endDate,
        technologies: proj.technologies || [],
        highlights: proj.highlights || [],
      })),
      jobPreferences: existingProfile?.jobPreferences || defaultJobPreferences,
      advancedPreferences: existingProfile?.advancedPreferences || defaultAdvancedPreferences,
      cvMetadata: {
        originalFilename: cvPath.split("/").pop() || "cv",
        uploadedAt: existingProfile?.cvMetadata?.uploadedAt || now,
        fileType: fileType as "pdf" | "docx",
        fileSize: 0, // We don't track this in extraction
        extractedAt: now,
      },
    };

    // Save the updated profile
    await saveProfile(updatedProfile);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: "CV extracted successfully",
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Extraction failed",
      },
      { status: 500 }
    );
  }
}
