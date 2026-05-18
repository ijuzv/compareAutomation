/**
 * Shared helpers for web + mobile screenshot folder layout:
 * `{folderSlug}/{runTimestamp}/v2-{tab}.png` (production) and `v3-{tab}.png` (UAT).
 */

export type TickerTeam = { ShortName?: string; Name?: string };

/** Minimal ticker row fields used to build `folderSlug`. */
export type TickerFixtureRow = {
  Id: number;
  StartDateTime: string;
  EndDateTime: string;
  IsCompleted: boolean;
  IsLive?: boolean;
  HomeTeam?: TickerTeam;
  AwayTeam?: TickerTeam;
};

export type ActiveMatch = {
  /** Root Fixtures[].Id (same as in `/matches/CA:{Id}`). */
  id: number;
  /** Safe directory name, e.g. `KXI-vs-MI_id40266`. */
  folderSlug: string;
};

/** Production screenshots use v2-; UAT / next-gen web host uses v3-. */
export type ScreenshotVersionPrefix = 'v2' | 'v3';

export function versionPrefixForWebSide(side: 'uat' | 'prod'): ScreenshotVersionPrefix {
  return side === 'uat' ? 'v3' : 'v2';
}

export function versionPrefixForMobileEnv(env: 'prod' | 'uat'): ScreenshotVersionPrefix {
  return env === 'uat' ? 'v3' : 'v2';
}

export function sanitizePathSegment(raw: string): string {
  let s = raw
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length > 48) {
    s = s.slice(0, 48).replace(/-+$/g, '');
  }
  return s.length > 0 ? s : 'x';
}

export function buildMatchFolderSlugFromTickerRow(f: TickerFixtureRow): string {
  const home = sanitizePathSegment(f.HomeTeam?.ShortName || f.HomeTeam?.Name || 'Home');
  const away = sanitizePathSegment(f.AwayTeam?.ShortName || f.AwayTeam?.Name || 'Away');
  return `${home}-vs-${away}_id${f.Id}`;
}

export function fallbackMatchFolderSlug(id: number): string {
  return sanitizePathSegment(`match_id${id}`);
}

/** Optional override when ticker fetch fails, e.g. `KXI-vs-MI_id40266` (MOBILE_FALLBACK_FOLDER_SLUG). */
export function folderSlugOverrideFromEnv(matchId: number): string | undefined {
  const raw = process.env.MOBILE_FALLBACK_FOLDER_SLUG?.trim();
  if (!raw) {
    return undefined;
  }
  const envId = Number.parseInt(process.env.MOBILE_FALLBACK_MATCH_ID ?? '', 10);
  if (!Number.isNaN(envId) && envId !== matchId) {
    return undefined;
  }
  return sanitizePathSegment(raw);
}
