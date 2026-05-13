/**
 * Installed app id for deep links and scripts. Override with MOBILE_APP_PACKAGE if needed.
 * Defaults align with wdio capabilities (au.com.cricket).
 */
export const APP_PACKAGE = process.env.MOBILE_APP_PACKAGE ?? 'au.com.cricket';

/** Deep link to open the in-app API / environment config screen */
export const DEEP_LINK_CONFIG =
    process.env.MOBILE_DEEP_LINK_CONFIG ?? 'cricketapp://config';

/**
 * Base URI for match deep links, must include trailing path segment if required.
 * Example defaults: cricketapp://match/  or  au.com.cricket://match/
 */
const MATCH_DEEP_LINK_BASE =
    process.env.MOBILE_DEEP_LINK_MATCH_BASE ?? 'cricketapp://match/';

/** Optional list / hub screen when UI navigation is unreliable */
export const DEEP_LINK_MATCHES_HUB =
    process.env.MOBILE_DEEP_LINK_MATCHES_HUB ?? '';

export function buildMatchDeepLink(matchId: number): string {
    return `${MATCH_DEEP_LINK_BASE}${matchId}`;
}
