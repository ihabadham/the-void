import { google } from "googleapis";

export class GmailAPI {
  private gmail: any;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.gmail = google.gmail({ version: "v1", auth });
  }

  async getMessages(query: string = "", maxResults: number = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      });

      return response.data.messages || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  async getMessage(messageId: string) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching message:", error);
      throw error;
    }
  }

  async searchJobApplicationEmails() {
    // Search for emails related to job applications
    const queries = [
      "subject:(application OR interview OR position OR job OR hiring)",
      "from:(careers OR hr OR recruiting OR talent OR noreply)",
      "body:(thank you for your application OR interview OR assessment OR offer)",
    ];

    const allMessages = [];

    for (const query of queries) {
      try {
        const messages = await this.getMessages(query, 50);
        allMessages.push(...messages);
      } catch (error) {
        console.error(`Error with query "${query}":`, error);
      }
    }

    // Remove duplicates based on message ID
    const uniqueMessages = allMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );

    return uniqueMessages;
  }
}

export async function createGmailClient(accessToken: string) {
  return new GmailAPI(accessToken);
}
