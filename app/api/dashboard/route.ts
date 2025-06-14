import { NextResponse } from "next/server";
import {
  getApplicationsForCurrentUser,
  getDashboardDataForCurrentUser,
} from "@/lib/server/data-fetching";

export async function GET() {
  try {
    const [applications, dashboardData] = await Promise.all([
      getApplicationsForCurrentUser(),
      getDashboardDataForCurrentUser(),
    ]);

    return NextResponse.json({
      applications,
      stats: dashboardData.stats,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
