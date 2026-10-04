import { describe, expect, it } from "vitest";
import { formatDateForDisplay, normalizeDateToInput } from "./date-formatter.ts";

describe("date-formatter service", () => {
  describe("normalizeDateToInput", () => {
    it("handles already valid YYYY-MM-DD", () => {
      expect(normalizeDateToInput("2026-08-16")).toBe("2026-08-16");
    });

    it("normalizes Japanese date strings", () => {
      expect(normalizeDateToInput("2026年8月16日")).toBe("2026-08-16");
      expect(normalizeDateToInput("2024年12月31日")).toBe("2024-12-31");
      expect(normalizeDateToInput("2025年5月3日")).toBe("2025-05-03");
    });

    it("normalizes slash and dot formats", () => {
      expect(normalizeDateToInput("2026/8/16")).toBe("2026-08-16");
      expect(normalizeDateToInput("2026/08/16")).toBe("2026-08-16");
      expect(normalizeDateToInput("2026.8.16")).toBe("2026-08-16");
      expect(normalizeDateToInput("2026-8-9")).toBe("2026-08-09");
    });

    it("normalizes year-month without day to 1st day", () => {
      expect(normalizeDateToInput("2026年8月")).toBe("2026-08-01");
      expect(normalizeDateToInput("2024/11")).toBe("2024-11-01");
    });

    it("returns empty string for invalid or unparseable formats", () => {
      expect(normalizeDateToInput("")).toBe("");
      expect(normalizeDateToInput("2026年夏")).toBe("");
      expect(normalizeDateToInput("初版")).toBe("");
    });
  });

  describe("formatDateForDisplay", () => {
    it("formats YYYY-MM-DD to Japanese format", () => {
      expect(formatDateForDisplay("2026-08-16")).toBe("2026年8月16日");
      expect(formatDateForDisplay("2025-01-05")).toBe("2025年1月5日");
    });

    it("returns raw string if not YYYY-MM-DD", () => {
      expect(formatDateForDisplay("2026年夏")).toBe("2026年夏");
      expect(formatDateForDisplay("")).toBe("");
    });
  });
});
