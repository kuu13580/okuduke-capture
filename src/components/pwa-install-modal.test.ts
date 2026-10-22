import { describe, expect, it } from "vitest";
import { PwaInstallModal } from "./pwa-install-modal.ts";

describe("pwa-install-modal rendering", () => {
  const getRenderedString = (modal: PwaInstallModal): string => {
    return JSON.stringify(modal.render());
  };

  describe("Eligible Android devices", () => {
    it.each([
      [
        "Pixel 8 Pro (Chrome on Android with UA Reduction)",
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
      ],
      [
        "Galaxy S24 Ultra (Samsung Internet)",
        "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.6167.101 Mobile Safari/537.36",
      ],
      [
        "Xperia 1 VI (Firefox Mobile)",
        "Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0",
      ],
      [
        "Galaxy Tab S9 (Android Tablet without 'Mobile' token)",
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      ],
    ])("renders Google Play link for %s", (_, userAgent) => {
      const modal = new PwaInstallModal();
      modal.isOpen = true;
      modal.deviceOptions = { userAgent };

      const content = getRenderedString(modal);
      expect(content).toContain("btn-play-store-primary");
      expect(content).toContain("Google Play から");
      expect(content).toContain("アプリをダウンロード");
    });

    it("renders Google Play link via User-Agent Client Hints (UA-CH)", () => {
      const modal = new PwaInstallModal();
      modal.isOpen = true;
      modal.deviceOptions = { userAgentDataPlatform: "Android" };

      const content = getRenderedString(modal);
      expect(content).toContain("btn-play-store-primary");
      expect(content).toContain("Google Play から");
    });
  });

  describe("Ineligible devices (Must NOT render Google Play link)", () => {
    describe("iOS devices", () => {
      it.each([
        [
          "iPhone 15 Pro (Mobile Safari)",
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
          0,
        ],
        [
          "iPhone 14 (Chrome on iOS - CriOS)",
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/116.0.5845.177 Mobile/15E148 Safari/604.1",
          0,
        ],
        [
          "iPad Pro (iPadOS 17 Safari desktop UA with touch)",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
          5,
        ],
        [
          "iPad Air (Legacy iPad iOS 12 UA)",
          "Mozilla/5.0 (iPad; CPU OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1",
          0,
        ],
      ])("does not show Google Play button for %s", (_, userAgent, maxTouchPoints) => {
        const modal = new PwaInstallModal();
        modal.isOpen = true;
        modal.deviceOptions = { userAgent, maxTouchPoints };

        const content = getRenderedString(modal);
        expect(content).not.toContain("btn-play-store-primary");
        expect(content).not.toContain("Google Play から");
        expect(content).toContain("共有ボタン");
      });
    });

    describe("Desktop devices", () => {
      it.each([
        [
          "Windows 11 Chrome",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        ],
        [
          "Windows 11 Edge",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0",
        ],
        [
          "Windows 11 Firefox",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
        ],
        [
          "macOS Sonoma Safari (Desktop)",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        ],
        [
          "macOS Sonoma Chrome",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        ],
        [
          "Ubuntu Linux Chrome",
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        ],
        [
          "Ubuntu Linux Firefox",
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
        ],
      ])("does not show Google Play button for %s", (_, userAgent) => {
        const modal = new PwaInstallModal();
        modal.isOpen = true;
        modal.deviceOptions = { userAgent, maxTouchPoints: 0 };

        const content = getRenderedString(modal);
        expect(content).not.toContain("btn-play-store-primary");
        expect(content).not.toContain("Google Play から");
      });

      it("does not show Google Play button on Windows / macOS UA-CH platform", () => {
        const modalWindows = new PwaInstallModal();
        modalWindows.isOpen = true;
        modalWindows.deviceOptions = { userAgentDataPlatform: "Windows" };
        expect(getRenderedString(modalWindows)).not.toContain("btn-play-store-primary");

        const modalMac = new PwaInstallModal();
        modalMac.isOpen = true;
        modalMac.deviceOptions = { userAgentDataPlatform: "macOS" };
        expect(getRenderedString(modalMac)).not.toContain("btn-play-store-primary");
      });
    });
  });
});
