export const SIDEBAR_COOKIE_NAME = "sidebar_state";

export function parseSidebarCookie(value: string | undefined | null): boolean {
  return value !== "false";
}

export function readSidebarCookieFromDocument(): boolean | undefined {
  if (typeof document === "undefined") return undefined;

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${SIDEBAR_COOKIE_NAME}=([^;]*)`),
  );

  if (!match) return undefined;
  return parseSidebarCookie(match[1]);
}
