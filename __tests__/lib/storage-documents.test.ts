// Mock Supabase client to avoid dependency issues in tests
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

import { generateDocumentPath } from "@/lib/storage/documents";

describe("Storage Documents", () => {
  describe("generateDocumentPath", () => {
    it("should generate consistent file paths", () => {
      const userId = "user123";
      const applicationId = "app456";
      const documentId = "doc789";
      const filename = "test-file.pdf";

      const result = generateDocumentPath(
        userId,
        applicationId,
        documentId,
        filename
      );

      expect(result).toBe("user123/app456/doc789-test-file.pdf");
    });

    it("should sanitize filenames with special characters", () => {
      const userId = "user123";
      const applicationId = "app456";
      const documentId = "doc789";
      const filename = "My Resume (Final Version)!.pdf";

      const result = generateDocumentPath(
        userId,
        applicationId,
        documentId,
        filename
      );

      // Special characters should be replaced with underscores
      expect(result).toBe(
        "user123/app456/doc789-My_Resume__Final_Version__.pdf"
      );
    });

    it("should handle filenames with spaces", () => {
      const userId = "user123";
      const applicationId = "app456";
      const documentId = "doc789";
      const filename = "Cover Letter.docx";

      const result = generateDocumentPath(
        userId,
        applicationId,
        documentId,
        filename
      );

      expect(result).toBe("user123/app456/doc789-Cover_Letter.docx");
    });

    it("should handle filenames with multiple special characters", () => {
      const userId = "user123";
      const applicationId = "app456";
      const documentId = "doc789";
      const filename = "Portfolio@2024#v2$.zip";

      const result = generateDocumentPath(
        userId,
        applicationId,
        documentId,
        filename
      );

      expect(result).toBe("user123/app456/doc789-Portfolio_2024_v2_.zip");
    });

    it("should preserve allowed characters (alphanumeric, dots, dashes, underscores)", () => {
      const userId = "user123";
      const applicationId = "app456";
      const documentId = "doc789";
      const filename = "resume_v2.1-final.pdf";

      const result = generateDocumentPath(
        userId,
        applicationId,
        documentId,
        filename
      );

      expect(result).toBe("user123/app456/doc789-resume_v2.1-final.pdf");
    });

    it("should handle empty filename gracefully", () => {
      const userId = "user123";
      const applicationId = "app456";
      const documentId = "doc789";
      const filename = "";

      const result = generateDocumentPath(
        userId,
        applicationId,
        documentId,
        filename
      );

      expect(result).toBe("user123/app456/doc789-");
    });

    it("should ensure upload and download paths match for problematic filenames", () => {
      const userId = "user123";
      const applicationId = "app456";
      const documentId = "doc789";
      const problematicFilename = "My Resume (Final) - Copy.pdf";

      // Simulate upload path generation
      const uploadPath = generateDocumentPath(
        userId,
        applicationId,
        documentId,
        problematicFilename
      );

      // Simulate download path generation (should be identical)
      const downloadPath = generateDocumentPath(
        userId,
        applicationId,
        documentId,
        problematicFilename
      );

      expect(uploadPath).toBe(downloadPath);
      expect(uploadPath).toBe(
        "user123/app456/doc789-My_Resume__Final__-_Copy.pdf"
      );
    });

    it("should handle Unicode characters by replacing them", () => {
      const userId = "user123";
      const applicationId = "app456";
      const documentId = "doc789";
      const filename = "résumé_español.pdf";

      const result = generateDocumentPath(
        userId,
        applicationId,
        documentId,
        filename
      );

      // Unicode characters should be replaced with underscores
      expect(result).toBe("user123/app456/doc789-r_sum__espa_ol.pdf");
    });
  });
});
