import { NextResponse } from "next/server";
import {
  getApplicationsForCurrentUser,
  createApplicationForCurrentUser,
} from "@/lib/server/data-fetching";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const application = await createApplicationForCurrentUser(body);

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Create application API error:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
