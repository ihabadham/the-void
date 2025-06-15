import { NextResponse } from "next/server";
import {
  getDocumentsForCurrentUser,
  getApplicationsForCurrentUser,
  createDocumentForCurrentUser,
} from "@/lib/server/data-fetching";

export async function GET() {
  try {
    const [documents, applications] = await Promise.all([
      getDocumentsForCurrentUser(),
      getApplicationsForCurrentUser(),
    ]);

    return NextResponse.json({
      documents,
      applications: applications.map((app) => ({
        id: app.id,
        company: app.company,
        position: app.position,
      })),
    });
  } catch (error) {
    console.error("Documents API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const document = await createDocumentForCurrentUser(body);

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Create document API error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
