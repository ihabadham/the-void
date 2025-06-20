import { getApplicationsByUserId } from "./applications";

/**
 * Dashboard statistics functions
 */

export async function getDashboardStats(userId: string) {
  try {
    // Get all applications for the user
    const userApplications = await getApplicationsByUserId(userId);

    // Calculate stats
    const total = userApplications.length;
    const pending = userApplications.filter((app) =>
      ["applied", "assessment", "interview"].includes(app.status)
    ).length;
    const interviews = userApplications.filter(
      (app) => app.status === "interview"
    ).length;
    const rejections = userApplications.filter(
      (app) => app.status === "rejected"
    ).length;
    const offers = userApplications.filter(
      (app) => app.status === "offer"
    ).length;

    // Get upcoming events
    const now = new Date();
    const upcomingEvents = userApplications
      .filter((app) => app.nextDate && new Date(app.nextDate) > now)
      .sort(
        (a, b) =>
          new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime()
      )
      .slice(0, 5);

    // Get recent applications
    const recentApplications = userApplications
      .sort(
        (a, b) =>
          new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
      )
      .slice(0, 5);

    return {
      stats: {
        total,
        pending,
        interviews,
        rejections,
        offers,
      },
      upcomingEvents,
      recentApplications,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw new Error("Failed to get dashboard statistics");
  }
}
