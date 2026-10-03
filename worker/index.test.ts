import { describe, expect, it, vi } from "vitest";
import app, { type RateLimitBinding } from "./index.ts";

describe("Worker BFF API", () => {
  it("GET /api/health returns 200 ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("ok");
  });

  describe("Rate Limiter", () => {
    it("returns 429 Too Many Requests with Retry-After header when rate limit is exceeded", async () => {
      const mockLimiter: RateLimitBinding = {
        limit: vi.fn().mockResolvedValue({ success: false }),
      };

      const res = await app.request(
        "/api/extract",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "cf-connecting-ip": "203.0.113.195",
          },
          body: JSON.stringify({
            base64Data: "test",
            mimeType: "image/jpeg",
          }),
        },
        {
          RATE_LIMITER: mockLimiter,
          GEMINI_API_KEY: "dummy-key",
        },
      );

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("60");
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("短時間のアクセス数が上限を超過しました");
      expect(mockLimiter.limit).toHaveBeenCalledWith({ key: "203.0.113.195" });
    });

    it("fails open and proceeds when rate limiter throws an error", async () => {
      const mockLimiter: RateLimitBinding = {
        limit: vi.fn().mockRejectedValue(new Error("Cloudflare rate limit internal error")),
      };

      const res = await app.request(
        "/api/extract",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "cf-connecting-ip": "203.0.113.195",
          },
          body: JSON.stringify({
            base64Data: "test",
            mimeType: "image/jpeg",
          }),
        },
        {
          RATE_LIMITER: mockLimiter,
          // Omitting GEMINI_API_KEY so it proceeds past rate limiter and hits 500 (API key missing)
        },
      );

      expect(res.status).toBe(500);
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("Gemini APIキーが設定されていません");
    });
  });

  describe("Payload and API key validation", () => {
    it("returns 413 when content-length exceeds 2MB", async () => {
      const res = await app.request(
        "/api/extract",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "content-length": "3000000",
          },
          body: JSON.stringify({}),
        },
        {
          GEMINI_API_KEY: "dummy-key",
        },
      );

      expect(res.status).toBe(413);
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("2MB");
    });

    it("returns 500 when GEMINI_API_KEY is not configured", async () => {
      const res = await app.request(
        "/api/extract",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
        {
          // No GEMINI_API_KEY
        },
      );

      expect(res.status).toBe(500);
    });
  });
});
