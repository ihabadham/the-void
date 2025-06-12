/**
 * Gmail Service for Job Application Email Processing
 * This service handles fetching, parsing, and categorizing job-related emails
 */

import { google } from "googleapis";
import {
  createAuthenticatedGmailClient,
  type GoogleTokenResponse,
} from "./gmail-server";
import { getGmailTokensSecurely } from "./gmail-token-store";
import { getCurrentUser } from "./auth-helpers";

// Email processing interfaces
export interface JobEmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  snippet: string;
  body: string;
  labels: string[];
  category: JobEmailCategory;
  company?: string;
  jobTitle?: string;
  confidence: number; // 0-1 score for job relevance
}

export enum JobEmailCategory {
  APPLICATION_CONFIRMATION = "application_confirmation",
  INTERVIEW_INVITATION = "interview_invitation",
  INTERVIEW_CONFIRMATION = "interview_confirmation",
  INTERVIEW_RESCHEDULE = "interview_reschedule",
  REJECTION = "rejection",
  OFFER = "offer",
  ASSESSMENT_INVITATION = "assessment_invitation",
  RECRUITER_OUTREACH = "recruiter_outreach",
  JOB_ALERT = "job_alert",
  OTHER = "other",
}

export interface GmailServiceOptions {
  maxResults?: number;
  daysBack?: number;
  includeSpam?: boolean;
  includeTrash?: boolean;
}

/**
 * Main Gmail Service Class
 */
export class GmailService {
  private gmail: any;
  private userEmail: string;

  constructor(gmail: any, userEmail: string) {
    this.gmail = gmail;
    this.userEmail = userEmail;
  }

  /**
   * Factory method to create authenticated Gmail service for current user
   */
  static async forCurrentUser(): Promise<GmailService | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const tokens = await getGmailTokensSecurely(user.email);
      if (!tokens) {
        return null; // User hasn't connected Gmail
      }

      const gmail = createAuthenticatedGmailClient(tokens);
      return new GmailService(gmail, user.email);
    } catch (error) {
      console.error("Failed to create Gmail service:", error);
      return null;
    }
  }

  /**
   * Fetch job-related emails with smart filtering
   */
  async fetchJobEmails(
    options: GmailServiceOptions = {}
  ): Promise<JobEmailMessage[]> {
    try {
      const {
        maxResults = 50,
        daysBack = 30,
        includeSpam = false,
        includeTrash = false,
      } = options;

      // Build Gmail search query for job-related emails
      const query = this.buildJobSearchQuery(
        daysBack,
        includeSpam,
        includeTrash
      );

      console.log(`Searching Gmail with query: ${query}`);

      // Fetch message IDs
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      });

      if (!response.data.messages) {
        return [];
      }

      // Fetch full message details in parallel (but rate-limited)
      const messages = await this.fetchMessagesInBatches(
        response.data.messages
      );

      // Process and categorize emails
      const jobEmails = messages
        .map((msg) => this.processJobEmail(msg))
        .filter((email) => email.confidence > 0.3) // Filter out low-confidence matches
        .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending

      console.log(`Found ${jobEmails.length} job-related emails`);
      return jobEmails;
    } catch (error) {
      console.error("Failed to fetch job emails:", error);
      throw new Error("Failed to fetch emails from Gmail");
    }
  }

  /**
   * Build smart search query for job-related emails
   */
  private buildJobSearchQuery(
    daysBack: number,
    includeSpam: boolean,
    includeTrash: boolean
  ): string {
    const dateFilter = `newer_than:${daysBack}d`;

    // Common job-related keywords and patterns
    const keywords = [
      // Application confirmations
      'subject:("application received" OR "application submitted" OR "thank you for applying")',

      // Interview invitations
      'subject:("interview" OR "phone screening" OR "video call" OR "meet with")',

      // Assessments and tests
      'subject:("assessment" OR "coding challenge" OR "technical test" OR "homework")',

      // Offers and decisions
      'subject:("offer" OR "congratulations" OR "welcome to" OR "position")',

      // Rejections (unfortunately common)
      'subject:("unfortunately" OR "not moving forward" OR "other candidates")',

      // Recruiter outreach
      'from:("recruit" OR "talent" OR "hr" OR "hiring")',

      // Company domains and careers
      'from:("careers@" OR "jobs@" OR "noreply@" OR "no-reply@")',

      // Job boards and platforms
      'from:("linkedin" OR "indeed" OR "glassdoor" OR "stackoverflow")',
    ];

    const keywordQuery = `(${keywords.join(" OR ")})`;

    let query = `${keywordQuery} ${dateFilter}`;

    if (!includeSpam) {
      query += " -in:spam";
    }

    if (!includeTrash) {
      query += " -in:trash";
    }

    return query;
  }

  /**
   * Fetch message details in rate-limited batches
   */
  private async fetchMessagesInBatches(
    messageIds: { id: string }[]
  ): Promise<any[]> {
    const batchSize = 10; // Gmail API rate limiting
    const delay = 100; // ms between batches
    const messages: any[] = [];

    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);

      const batchPromises = batch.map(({ id }) =>
        this.gmail.users.messages
          .get({
            userId: "me",
            id,
            format: "full",
          })
          .then((response: any) => response.data)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === "fulfilled") {
          messages.push(result.value);
        } else {
          console.warn("Failed to fetch message:", result.reason);
        }
      });

      // Rate limiting delay
      if (i + batchSize < messageIds.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return messages;
  }

  /**
   * Process and categorize a single email message
   */
  private processJobEmail(message: any): JobEmailMessage {
    const headers = message.payload.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
        ?.value || "";

    const subject = getHeader("Subject");
    const from = getHeader("From");
    const to = getHeader("To");
    const date = new Date(parseInt(message.internalDate));

    // Extract email body
    const body = this.extractEmailBody(message.payload);

    // Categorize the email
    const category = this.categorizeJobEmail(subject, from, body);

    // Extract company and job title
    const { company, jobTitle } = this.extractJobDetails(subject, from, body);

    // Calculate confidence score
    const confidence = this.calculateJobRelevanceScore(
      subject,
      from,
      body,
      category
    );

    return {
      id: message.id,
      threadId: message.threadId,
      subject,
      from,
      to,
      date,
      snippet: message.snippet || "",
      body,
      labels: message.labelIds || [],
      category,
      company,
      jobTitle,
      confidence,
    };
  }

  /**
   * Extract email body text from Gmail message payload
   */
  private extractEmailBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, "base64").toString("utf8");
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          return Buffer.from(part.body.data, "base64").toString("utf8");
        }
        if (part.mimeType === "text/html" && part.body?.data) {
          const html = Buffer.from(part.body.data, "base64").toString("utf8");
          // Basic HTML to text conversion (you might want to use a proper library)
          return html
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      }
    }

    return "";
  }

  /**
   * Categorize email based on content analysis
   */
  private categorizeJobEmail(
    subject: string,
    from: string,
    body: string
  ): JobEmailCategory {
    const text = `${subject} ${from} ${body}`.toLowerCase();

    // Interview-related
    if (
      text.includes("interview") ||
      text.includes("phone screening") ||
      text.includes("video call")
    ) {
      if (text.includes("reschedule") || text.includes("postpone")) {
        return JobEmailCategory.INTERVIEW_RESCHEDULE;
      }
      if (text.includes("confirm") || text.includes("confirmation")) {
        return JobEmailCategory.INTERVIEW_CONFIRMATION;
      }
      return JobEmailCategory.INTERVIEW_INVITATION;
    }

    // Assessment invitations
    if (
      text.includes("assessment") ||
      text.includes("coding challenge") ||
      text.includes("technical test")
    ) {
      return JobEmailCategory.ASSESSMENT_INVITATION;
    }

    // Application confirmations
    if (
      text.includes("application received") ||
      text.includes("thank you for applying")
    ) {
      return JobEmailCategory.APPLICATION_CONFIRMATION;
    }

    // Offers
    if (
      text.includes("offer") ||
      text.includes("congratulations") ||
      text.includes("welcome to the team")
    ) {
      return JobEmailCategory.OFFER;
    }

    // Rejections
    if (
      text.includes("unfortunately") ||
      text.includes("not moving forward") ||
      text.includes("other candidates")
    ) {
      return JobEmailCategory.REJECTION;
    }

    // Recruiter outreach
    if (
      from.includes("recruit") ||
      from.includes("talent") ||
      text.includes("opportunity")
    ) {
      return JobEmailCategory.RECRUITER_OUTREACH;
    }

    // Job alerts
    if (
      from.includes("linkedin") ||
      from.includes("indeed") ||
      text.includes("job alert")
    ) {
      return JobEmailCategory.JOB_ALERT;
    }

    return JobEmailCategory.OTHER;
  }

  /**
   * Extract company name and job title from email content
   */
  private extractJobDetails(
    subject: string,
    from: string,
    body: string
  ): { company?: string; jobTitle?: string } {
    let company: string | undefined;
    let jobTitle: string | undefined;

    // Extract company from email domain
    const fromMatch = from.match(/@([^.]+)\./);
    if (fromMatch) {
      company = fromMatch[1].charAt(0).toUpperCase() + fromMatch[1].slice(1);
    }

    // Extract job title from subject
    const titlePatterns = [
      /position[:\s]+([^,\n]+)/i,
      /role[:\s]+([^,\n]+)/i,
      /for\s+([^,\n]+)\s+position/i,
      /([^,\n]+)\s+role/i,
    ];

    for (const pattern of titlePatterns) {
      const match = subject.match(pattern);
      if (match) {
        jobTitle = match[1].trim();
        break;
      }
    }

    return { company, jobTitle };
  }

  /**
   * Calculate job relevance confidence score (0-1)
   */
  private calculateJobRelevanceScore(
    subject: string,
    from: string,
    body: string,
    category: JobEmailCategory
  ): number {
    let score = 0;

    // Base score by category
    const categoryScores = {
      [JobEmailCategory.APPLICATION_CONFIRMATION]: 0.9,
      [JobEmailCategory.INTERVIEW_INVITATION]: 0.95,
      [JobEmailCategory.INTERVIEW_CONFIRMATION]: 0.9,
      [JobEmailCategory.INTERVIEW_RESCHEDULE]: 0.85,
      [JobEmailCategory.ASSESSMENT_INVITATION]: 0.9,
      [JobEmailCategory.OFFER]: 0.95,
      [JobEmailCategory.REJECTION]: 0.8,
      [JobEmailCategory.RECRUITER_OUTREACH]: 0.7,
      [JobEmailCategory.JOB_ALERT]: 0.5,
      [JobEmailCategory.OTHER]: 0.3,
    };

    score = categoryScores[category];

    // Boost score for known job-related domains
    const jobDomains = ["careers", "jobs", "talent", "recruiting", "hr"];
    if (jobDomains.some((domain) => from.toLowerCase().includes(domain))) {
      score += 0.1;
    }

    // Boost score for specific job-related keywords
    const text = `${subject} ${body}`.toLowerCase();
    const jobKeywords = [
      "software",
      "developer",
      "engineer",
      "position",
      "opportunity",
      "application",
    ];
    const keywordMatches = jobKeywords.filter((keyword) =>
      text.includes(keyword)
    ).length;
    score += keywordMatches * 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Get Gmail user profile information
   */
  async getUserProfile() {
    try {
      const response = await this.gmail.users.getProfile({ userId: "me" });
      return response.data;
    } catch (error) {
      console.error("Failed to get Gmail profile:", error);
      throw new Error("Failed to get Gmail profile");
    }
  }

  /**
   * Search for specific emails by query
   */
  async searchEmails(query: string, maxResults: number = 20) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      });

      if (!response.data.messages) {
        return [];
      }

      return this.fetchMessagesInBatches(response.data.messages);
    } catch (error) {
      console.error("Failed to search emails:", error);
      throw new Error("Failed to search emails");
    }
  }
}
