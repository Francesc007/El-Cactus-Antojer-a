export type InstallPlatform =
  | "android"
  | "ios-safari"
  | "ios-in-app"
  | "ios-other"
  | "desktop"
  | "standalone";

export function getInstallPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "desktop";

  const ua = navigator.userAgent;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (isStandalone) return "standalone";

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isInAppBrowser =
    /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp/i.test(ua) ||
    (isIOS && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua));

  if (isIOS && isInAppBrowser) return "ios-in-app";
  if (isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)) {
    return "ios-safari";
  }
  if (isIOS) return "ios-other";
  if (isAndroid) return "android";
  return "desktop";
}

export function isMobileInstallCandidate(platform: InstallPlatform): boolean {
  return (
    platform === "android" ||
    platform === "ios-safari" ||
    platform === "ios-in-app" ||
    platform === "ios-other"
  );
}
