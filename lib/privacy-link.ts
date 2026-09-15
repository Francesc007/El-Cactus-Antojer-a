export function isSafeReturnPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export function privacyHref(fromPath: string): string {
  return `/privacidad?from=${encodeURIComponent(fromPath)}`;
}
