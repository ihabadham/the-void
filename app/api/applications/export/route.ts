import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { getApplicationsByUserId } from "@/lib/data-access/applications";

// Query parameters schema for export
const querySchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
  status: z.string().optional(), // Filter by status
});

export const GET = withValidation(
  async (request: NextRequest, { query }) => {
    // Require authentication
    const user = await requireAuth();

    // Get all applications for the user
    let applications = await getApplicationsByUserId(user.id);

    // Filter by status if provided
    if (query?.status) {
      applications = applications.filter((app) => app.status === query.status);
    }

    const format = query?.format || "json";

    if (format === "json") {
      // Return JSON format
      return createSuccessResponse(
        {
          exportDate: new Date().toISOString(),
          totalApplications: applications.length,
          applications,
        },
        "Applications exported successfully"
      );
    } else if (format === "csv") {
      // Convert to CSV format
      const csvHeaders = [
        "ID",
        "Company",
        "Position",
        "Status",
        "Applied Date",
        "Next Date",
        "Next Event",
        "CV Version",
        "Job URL",
        "Created At",
        "Updated At",
      ].join(",");

      const escapeCsv = (v: unknown) => {
        const s = String(v ?? "");
        // If it contains a quote, comma, or newline, wrap in quotes and double internal quotes
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const csvRows = applications.map((app) =>
        [
          escapeCsv(app.id),
          escapeCsv(app.company),
          escapeCsv(app.position),
          escapeCsv(app.status),
          escapeCsv(app.appliedDate.toISOString().split("T")[0]),
          escapeCsv(app.nextDate?.toISOString().split("T")[0] ?? ""),
          escapeCsv(app.nextEvent),
          escapeCsv(app.cvVersion),
          escapeCsv(app.jobUrl),
          escapeCsv(app.createdAt.toISOString()),
          escapeCsv(app.updatedAt.toISOString()),
        ].join(",")
      );

      const csvContent = [csvHeaders, ...csvRows].join("\n");

      // Return CSV as NextResponse
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="applications-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // This shouldn't happen due to schema validation, but just in case
    return createSuccessResponse(applications, "Applications exported");
  },
  {
    querySchema,
  }
);
