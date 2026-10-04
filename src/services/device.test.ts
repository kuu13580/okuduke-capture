import { describe, expect, it } from "vitest";
import { isAndroidDevice, isIosDevice, isPlayStoreEligible } from "./device.ts";

describe("device detection service", () => {
  describe("Android devices (Google Play store eligible)", () => {
    it("identifies Pixel 8 Pro (Chrome with User-Agent Reduction)", () => {
      const ua =
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36";
      expect(isAndroidDevice({ userAgent: ua })).toBe(true);
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(true);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("identifies Galaxy S24 Ultra (Samsung Internet)", () => {
      const ua =
        "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.6167.101 Mobile Safari/537.36";
      expect(isAndroidDevice({ userAgent: ua })).toBe(true);
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(true);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("identifies Xperia 1 VI (Firefox Mobile)", () => {
      const ua = "Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0";
      expect(isAndroidDevice({ userAgent: ua })).toBe(true);
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(true);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("identifies Galaxy Tab S9 (Android Tablet without 'Mobile' token)", () => {
      const ua =
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
      expect(isAndroidDevice({ userAgent: ua })).toBe(true);
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(true);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("identifies Xiaomi (Legacy Android Chrome UA format)", () => {
      const ua =
        "Mozilla/5.0 (Linux; Android 12; 2201123G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.129 Mobile Safari/537.36";
      expect(isAndroidDevice({ userAgent: ua })).toBe(true);
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(true);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("identifies via User-Agent Client Hints (UA-CH) platform", () => {
      expect(isAndroidDevice({ userAgentDataPlatform: "Android" })).toBe(true);
      expect(isPlayStoreEligible({ userAgentDataPlatform: "Android" })).toBe(true);
      expect(isAndroidDevice({ userAgentDataPlatform: "android" })).toBe(true);
    });
  });

  describe("iOS devices (Not eligible for Google Play store)", () => {
    it("rejects iPhone 15 Pro (Mobile Safari)", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua })).toBe(false);
      expect(isIosDevice({ userAgent: ua })).toBe(true);
    });

    it("rejects iPhone 14 (Chrome on iOS - CriOS)", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/116.0.5845.177 Mobile/15E148 Safari/604.1";
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua })).toBe(false);
      expect(isIosDevice({ userAgent: ua })).toBe(true);
    });

    it("rejects iPad Pro (iPadOS 17 Safari desktop UA with touch points)", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
      expect(isPlayStoreEligible({ userAgent: ua, maxTouchPoints: 5 })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua, maxTouchPoints: 5 })).toBe(false);
      expect(isIosDevice({ userAgent: ua, maxTouchPoints: 5 })).toBe(true);
    });

    it("rejects legacy iPad (iOS 12 Safari with explicit iPad token)", () => {
      const ua =
        "Mozilla/5.0 (iPad; CPU OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1";
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua })).toBe(false);
      expect(isIosDevice({ userAgent: ua })).toBe(true);
    });
  });

  describe("Desktop devices (Not eligible for Google Play store)", () => {
    it("rejects Windows 11 Chrome", () => {
      const ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua })).toBe(false);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("rejects Windows 11 Edge", () => {
      const ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0";
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua })).toBe(false);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("rejects Windows 11 Firefox", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0";
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua })).toBe(false);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("rejects macOS Sonoma Safari (no touch)", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
      expect(isPlayStoreEligible({ userAgent: ua, maxTouchPoints: 0 })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua, maxTouchPoints: 0 })).toBe(false);
      expect(isIosDevice({ userAgent: ua, maxTouchPoints: 0 })).toBe(false);
    });

    it("rejects macOS Sonoma Chrome", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
      expect(isPlayStoreEligible({ userAgent: ua, maxTouchPoints: 0 })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua, maxTouchPoints: 0 })).toBe(false);
      expect(isIosDevice({ userAgent: ua, maxTouchPoints: 0 })).toBe(false);
    });

    it("rejects Ubuntu Linux Chrome", () => {
      const ua =
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua })).toBe(false);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("rejects Ubuntu Linux Firefox", () => {
      const ua = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0";
      expect(isPlayStoreEligible({ userAgent: ua })).toBe(false);
      expect(isAndroidDevice({ userAgent: ua })).toBe(false);
      expect(isIosDevice({ userAgent: ua })).toBe(false);
    });

    it("rejects Windows / macOS in User-Agent Client Hints", () => {
      expect(isPlayStoreEligible({ userAgentDataPlatform: "Windows" })).toBe(false);
      expect(isPlayStoreEligible({ userAgentDataPlatform: "macOS" })).toBe(false);
      expect(isPlayStoreEligible({ userAgentDataPlatform: "Linux" })).toBe(false);
    });
  });
});
