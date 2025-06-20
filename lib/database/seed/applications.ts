import { database } from "@/lib/database/connection";
import { applications, userSettings } from "@/lib/database/schemas";
import { eq } from "drizzle-orm";

/**
 * Development seed script to populate database with showcase data
 * This replaces the localStorage dummy data approach
 */

const DEMO_USER_ID = "af1b62f5-c193-414d-b8de-d76419309ad3"; // Valid UUID for demo data

const SEED_APPLICATIONS = [
  {
    userId: DEMO_USER_ID,
    company: "TechCorp",
    position: "Senior Frontend Developer",
    status: "interview" as const,
    appliedDate: new Date("2024-01-15"),
    nextDate: new Date("2024-01-25"),
    nextEvent: "Technical Interview",
    cvVersion: "CV_v2.1_Frontend_Specialist",
    notes:
      "Great company culture. Spoke with Sarah from HR. Technical interview will cover React, TypeScript, and system design.",
    jobUrl: "https://techcorp.com/careers/senior-frontend",
  },
  {
    userId: DEMO_USER_ID,
    company: "StartupXYZ",
    position: "Full Stack Engineer",
    status: "rejected" as const,
    appliedDate: new Date("2024-01-10"),
    cvVersion: "CV_v2.0_Fullstack",
    notes:
      "Automated rejection email received. They went with someone with more backend experience.",
  },
  {
    userId: DEMO_USER_ID,
    company: "BigTech Inc",
    position: "Software Engineer",
    status: "assessment" as const,
    appliedDate: new Date("2024-01-20"),
    nextDate: new Date("2024-01-28"),
    nextEvent: "Coding Assessment",
    cvVersion: "CV_v2.1_BigTech_Optimized",
    notes:
      "HackerRank assessment. Focus on algorithms and data structures. 90 minutes, 3 problems.",
    jobUrl: "https://bigtech.com/jobs/swe-l4",
  },
  {
    userId: DEMO_USER_ID,
    company: "InnovateLabs",
    position: "React Developer",
    status: "applied" as const,
    appliedDate: new Date("2024-01-22"),
    cvVersion: "CV_v2.1_React_Focused",
    notes: "Applied through their website. Emphasize React Native experience.",
    jobUrl: "https://innovatelabs.io/careers/react-dev",
  },
  {
    userId: DEMO_USER_ID,
    company: "DataDriven Co",
    position: "Frontend Architect",
    status: "offer" as const,
    appliedDate: new Date("2024-01-05"),
    nextDate: new Date("2024-01-30"),
    nextEvent: "Offer Response Deadline",
    cvVersion: "CV_v2.2_Senior_Architect",
    notes:
      "Offer: $140k + equity. Need to respond by Jan 30. Great team, interesting tech stack (React, GraphQL, Micro-frontends).",
  },
  {
    userId: DEMO_USER_ID,
    company: "CloudFirst",
    position: "Senior Developer",
    status: "interview" as const,
    appliedDate: new Date("2024-01-18"),
    nextDate: new Date("2024-01-26"),
    nextEvent: "Final Round Interview",
    cvVersion: "CV_v2.1_Cloud_Native",
    notes:
      "Final round with CTO. Will discuss architecture decisions and leadership experience.",
    jobUrl: "https://cloudfirst.dev/careers/senior-dev",
  },
  {
    userId: DEMO_USER_ID,
    company: "FinTech Solutions",
    position: "JavaScript Developer",
    status: "withdrawn" as const,
    appliedDate: new Date("2024-01-12"),
    cvVersion: "CV_v2.0_JavaScript",
    notes:
      "Withdrew application after learning about their 60-hour work week policy.",
  },
  {
    userId: DEMO_USER_ID,
    company: "GreenTech Innovations",
    position: "Frontend Lead",
    status: "applied" as const,
    appliedDate: new Date("2024-01-23"),
    cvVersion: "CV_v2.2_Leadership",
    notes:
      "Mission-driven company. Applied via LinkedIn. Recruiter mentioned they're looking for someone with team lead experience.",
    jobUrl: "https://greentech.com/jobs/frontend-lead",
  },
];

const SEED_USER_SETTINGS = {
  userId: DEMO_USER_ID,
  notifications: true,
  autoSync: false,
  darkMode: true,
  emailReminders: true,
  exportFormat: "json" as const,
  dataRetention: 365,
};

export async function seedDevData() {
  try {
    console.log("🌱 Seeding development data...");

    // Check if any demo data already exists
    const [existingApps, existingSettings] = await Promise.all([
      database
        .select()
        .from(applications)
        .where(eq(applications.userId, DEMO_USER_ID))
        .limit(1),
      database
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, DEMO_USER_ID))
        .limit(1),
    ]);

    if (existingApps.length > 0 || existingSettings.length > 0) {
      console.log("📊 Development data already exists, skipping seed");
      return;
    }

    // Insert applications and user settings
    await database.transaction(async (tx) => {
      await tx.insert(applications).values(SEED_APPLICATIONS);
      console.log(`✅ Inserted ${SEED_APPLICATIONS.length} demo applications`);

      await tx.insert(userSettings).values(SEED_USER_SETTINGS);
      console.log("⚙️  Inserted demo user settings");
    });

    console.log("🎉 Development data seeded successfully!");
    console.log(
      "📝 Note: This data will be cleared when real applications are added"
    );
  } catch (error) {
    console.error("❌ Error seeding development data:", error);
    throw error;
  }
}

export async function clearDevData() {
  try {
    console.log("🧹 Clearing development data...");

    await database.transaction(async (tx) => {
      await tx
        .delete(applications)
        .where(eq(applications.userId, DEMO_USER_ID));

      await tx
        .delete(userSettings)
        .where(eq(userSettings.userId, DEMO_USER_ID));
    });

    console.log("✅ Development data cleared");
  } catch (error) {
    console.error("❌ Error clearing development data:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Refusing to run seed script in production.");
    process.exit(1);
  }

  const command = process.argv[2];

  if (command === "clear") {
    clearDevData()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    seedDevData()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}
