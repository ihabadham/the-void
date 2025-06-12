/**
 * Simple test to verify Jest setup is working correctly
 */
describe("Jest Setup", () => {
  test("should work with basic expectations", () => {
    expect(true).toBe(true);
  });

  test("should have access to Jest globals", () => {
    expect(jest).toBeDefined();
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  test("should handle async tests", async () => {
    const result = await Promise.resolve("test");
    expect(result).toBe("test");
  });
});

// Test DOM environment
describe("DOM Environment", () => {
  test("should have DOM globals available", () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
  });
});
