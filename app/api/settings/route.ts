import { NextResponse } from "next/server";
import {
  getSettingsForCurrentUser,
  updateSettingsForCurrentUser,
} from "@/lib/server/data-fetching";

export async function GET() {
  try {
    const settings = await getSettingsForCurrentUser();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const settings = await updateSettingsForCurrentUser(body);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Update settings API error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
