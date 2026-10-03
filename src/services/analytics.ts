declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = "G-TJP9JFVSWW";

export const PRODUCTION_HOSTS = new Set([
  "okuduke.kuu13580.com",
  "okuduke-capture.kuu13580.workers.dev",
]);

export const analyticsConfig = {
  // テスト用オーバーライド (null: 自動判定, true: 強制無効, false: 強制有効)
  disabledOverride: null as boolean | null,
};

export function isProductionHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location?.hostname || "";
  return PRODUCTION_HOSTS.has(host);
}

export function shouldSendEvents(): boolean {
  if (analyticsConfig.disabledOverride !== null) {
    return !analyticsConfig.disabledOverride;
  }
  if (typeof window === "undefined") return false;
  // 開発モード（Vite dev）または未許可ホストの場合は送信しない
  if (import.meta.env.DEV || !isProductionHost()) {
    return false;
  }
  return true;
}

export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>,
) {
  if (!shouldSendEvents()) {
    if (typeof window !== "undefined") {
      console.debug(`[Analytics (DEV/Local - Not Sent)] ${eventName}`, eventParams);
    }
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventParams);
  }
}

export const analytics = {
  scanStart(method: "camera" | "file") {
    trackEvent("scan_start", { method });
  },

  scanSuccess(fields: { hasTitle: boolean; hasCircle: boolean; hasAuthor: boolean }) {
    trackEvent("scan_success", {
      has_title: fields.hasTitle,
      has_circle: fields.hasCircle,
      has_author: fields.hasAuthor,
    });
  },

  scanError(errorType: string) {
    trackEvent("scan_error", { error_type: errorType });
  },

  recordSave() {
    trackEvent("record_save");
  },

  exportData(format: "tsv" | "csv", count: number) {
    trackEvent("export_data", { format, count });
  },

  pwaPromptShow() {
    trackEvent("pwa_prompt_show");
  },

  pwaInstallClick() {
    trackEvent("pwa_install_click");
  },
};
