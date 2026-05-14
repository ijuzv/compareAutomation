/**
 * Installed app id for deep links and scripts. Override with MOBILE_APP_PACKAGE if needed.
 * Defaults align with wdio capabilities (au.com.cricket).
 */
export const APP_PACKAGE = process.env.MOBILE_APP_PACKAGE ?? 'au.com.cricket';

/** Deep link to open the in-app API / environment config screen */
export const DEEP_LINK_CONFIG =
    process.env.MOBILE_DEEP_LINK_CONFIG ?? 'cricketapp://config';

/**
 * Base for match `-d` data URI (append ticker root Id, e.g. …CA:40266).
 */
const MATCH_DEEP_LINK_BASE =
    process.env.MOBILE_DEEP_LINK_MATCH_BASE ?? 'https://www.cricket.com.au/matches/CA:';

/** Optional list / hub screen when UI navigation is unreliable */
export const DEEP_LINK_MATCHES_HUB =
    process.env.MOBILE_DEEP_LINK_MATCHES_HUB ?? '';

export function buildMatchDeepLink(matchId: number): string {
    return `${MATCH_DEEP_LINK_BASE}${matchId}`;
}

/**
 * `-n` component for `adb shell am start …` VIEW match URLs (default matches your manual command).
 */
export const MATCH_VIEW_ACTIVITY_COMPONENT =
    process.env.MOBILE_ADB_VIEW_COMPONENT ?? `${APP_PACKAGE}/.ui.SplashActivity`;
