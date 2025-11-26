import { NextRequest, NextResponse } from "next/server";
import { saveProfile, getProfile } from "@/lib/data/profile-store";
import type { UserProfile } from "@/types/user-profile";

export async function POST(request: NextRequest) {
  try {
    const { userId, profile } = await request.json();

    if (!userId || !profile) {
      return NextResponse.json(
        { success: false, message: "User ID and profile data are required" },
        { status: 400 }
      );
    }

    // Get existing profile to preserve metadata
    const existingProfile = await getProfile(userId);
    if (!existingProfile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    // Merge updated data with existing profile
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...profile,
      id: userId,
      updatedAt: new Date().toISOString(),
      // Preserve critical metadata
      createdAt: existingProfile.createdAt,
      cvMetadata: existingProfile.cvMetadata,
    };

    // Save the updated profile
    await saveProfile(updatedProfile);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: "Profile saved successfully",
    });
  } catch (error) {
    console.error("Save profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to save profile",
      },
      { status: 500 }
    );
  }
}
