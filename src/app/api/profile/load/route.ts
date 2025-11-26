import { NextRequest, NextResponse } from "next/server";
import { getProfile, listProfiles } from "@/lib/data/profile-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // If userId provided, get specific profile
    if (userId) {
      const profile = await getProfile(userId);
      if (!profile) {
        return NextResponse.json(
          { success: false, message: "Profile not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, profile });
    }

    // Otherwise, get the most recent profile
    const profiles = await listProfiles();
    if (profiles.length === 0) {
      return NextResponse.json({ success: true, profile: null });
    }

    // Get the most recently updated profile
    const mostRecent = profiles[0]; // Already sorted by updatedAt desc
    const profile = await getProfile(mostRecent.id);

    return NextResponse.json({
      success: true,
      profile,
      userId: mostRecent.id,
    });
  } catch (error) {
    console.error("Load profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load profile",
      },
      { status: 500 }
    );
  }
}
