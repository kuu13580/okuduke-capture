declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = "G-TJP9JFVSWW";

export const analyticsConfig = {
  // テスト用オーバーライド (null: 自動判定, true: 強制無効, false: 強制有効)
  disabledOverride: null as boolean | null,
};

export function isLocalEnvironment(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location?.hostname || "";
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.endsWith(".local")
  );
}

export function shouldSendEvents(): boolean {
  if (analyticsConfig.disabledOverride !== null) {
    return !analyticsConfig.disabledOverride;
  }
  if (typeof window === "undefined") return false;
  // Vite開発サーバー実行中、またはローカルIP/ホストの場合は送信しない
  if (import.meta.env.DEV || isLocalEnvironment()) {
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
