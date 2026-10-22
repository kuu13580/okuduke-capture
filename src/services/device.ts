export interface DeviceDetectionOptions {
  userAgent?: string;
  userAgentDataPlatform?: string;
  maxTouchPoints?: number;
}

/**
 * Androidデバイス（Google Play ストア利用可能端末）か判定
 */
export function isAndroidDevice(options?: DeviceDetectionOptions): boolean {
  if (options?.userAgentDataPlatform) {
    return options.userAgentDataPlatform.toLowerCase() === "android";
  }

  if (typeof navigator !== "undefined" && (navigator as any).userAgentData?.platform) {
    if ((navigator as any).userAgentData.platform.toLowerCase() === "android") {
      return true;
    }
  }

  const ua = options?.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) return false;

  return /Android/i.test(ua);
}

/**
 * iOSデバイス（iPhone, iPad, iPod）か判定
 */
export function isIosDevice(options?: DeviceDetectionOptions): boolean {
  const ua = options?.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) return false;

  const isIosUa = /iPad|iPhone|iPod/.test(ua);
  const touchPoints =
    options?.maxTouchPoints ?? (typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0);
  const isMacTouch = /Macintosh/.test(ua) && touchPoints > 1;
  const isMsStream = typeof window !== "undefined" && Boolean((window as any).MSStream);

  return (isIosUa || isMacTouch) && !isMsStream;
}

/**
 * Google Play ストアのアプリダウンロード案内を表示すべき対象か判定
 * Android OS 端末のみを対象とし、iOS や デスクトップ PC 等は除外
 */
export function isPlayStoreEligible(options?: DeviceDetectionOptions): boolean {
  return isAndroidDevice(options);
}
