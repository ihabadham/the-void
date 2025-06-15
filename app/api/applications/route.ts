import { NextResponse } from "next/server";
import { getApplicationsForCurrentUser } from "@/lib/server/data-fetching";

export async function GET() {
  try {
    const applications = await getApplicationsForCurrentUser();
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Applications API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
