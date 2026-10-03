import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  analytics,
  analyticsConfig,
  isProductionHost,
  shouldSendEvents,
  trackEvent,
} from "./analytics.ts";

describe("analytics service", () => {
  let gtagMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagMock = vi.fn();
    analyticsConfig.disabledOverride = null;
    (globalThis as any).window = {
      gtag: gtagMock,
      location: { hostname: "localhost" },
    };
  });

  afterEach(() => {
    analyticsConfig.disabledOverride = null;
    delete (globalThis as any).window;
  });

  describe("environment detection", () => {
    it("allows only whitelisted production hosts", () => {
      (globalThis as any).window.location.hostname = "okuduke.kuu13580.com";
      expect(isProductionHost()).toBe(true);

      (globalThis as any).window.location.hostname = "okuduke-capture.kuu13580.workers.dev";
      expect(isProductionHost()).toBe(true);

      (globalThis as any).window.location.hostname = "localhost";
      expect(isProductionHost()).toBe(false);

      (globalThis as any).window.location.hostname = "127.0.0.1";
      expect(isProductionHost()).toBe(false);

      (globalThis as any).window.location.hostname = "172.16.0.1";
      expect(isProductionHost()).toBe(false);

      (globalThis as any).window.location.hostname = "192.168.1.10";
      expect(isProductionHost()).toBe(false);
    });

    it("blocks event sending on non-production hosts or dev mode", () => {
      (globalThis as any).window.location.hostname = "localhost";
      expect(shouldSendEvents()).toBe(false);

      trackEvent("test_dev_blocked", { foo: "bar" });
      expect(gtagMock).not.toHaveBeenCalled();
    });
  });

  describe("event tracking when enabled", () => {
    beforeEach(() => {
      // 送信を強制有効化してイベント送信を検証
      analyticsConfig.disabledOverride = false;
    });

    it("calls window.gtag with event name and params", () => {
      trackEvent("custom_event", { foo: "bar" });
      expect(gtagMock).toHaveBeenCalledWith("event", "custom_event", { foo: "bar" });
    });

    it("sends scan_start with method", () => {
      analytics.scanStart("camera");
      expect(gtagMock).toHaveBeenCalledWith("event", "scan_start", { method: "camera" });

      analytics.scanStart("file");
      expect(gtagMock).toHaveBeenCalledWith("event", "scan_start", { method: "file" });
    });

    it("sends scan_success with field flags only (no raw text)", () => {
      analytics.scanSuccess({ hasTitle: true, hasCircle: true, hasAuthor: false });
      expect(gtagMock).toHaveBeenCalledWith("event", "scan_success", {
        has_title: true,
        has_circle: true,
        has_author: false,
      });
    });

    it("sends scan_error with error_type", () => {
      analytics.scanError("extract_failed");
      expect(gtagMock).toHaveBeenCalledWith("event", "scan_error", {
        error_type: "extract_failed",
      });
    });

    it("sends export_data with format and count", () => {
      analytics.exportData("tsv", 5);
      expect(gtagMock).toHaveBeenCalledWith("event", "export_data", {
        format: "tsv",
        count: 5,
      });

      analytics.exportData("csv", 10);
      expect(gtagMock).toHaveBeenCalledWith("event", "export_data", {
        format: "csv",
        count: 10,
      });
    });

    it("sends pwa events", () => {
      analytics.pwaPromptShow();
      expect(gtagMock).toHaveBeenCalledWith("event", "pwa_prompt_show", undefined);

      analytics.pwaInstallClick();
      expect(gtagMock).toHaveBeenCalledWith("event", "pwa_install_click", undefined);
    });
  });
});
