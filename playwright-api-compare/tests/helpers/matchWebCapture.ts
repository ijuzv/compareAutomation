import type { Page } from '@playwright/test';

export type MatchTab = {
  /** Label for logs / screenshot filename */
  name: string;
  /** `?tab=` query value, e.g. https://www.cricket.com.au/matches/CA:39266?tab=summary */
  tabQuery: string;
};

/**
 * Match centre tabs (`?tab=`). Order is up to you; duplicate `name`/`tabQuery` would overwrite screenshots — keep one entry per tab.
 * Tabs that are missing on a build are skipped via `tabStripOffersTab` + try/catch in the spec.
 */
export const DEFAULT_MATCH_TABS: MatchTab[] = [
  { name: 'summary', tabQuery: 'summary' },
  { name: 'scorecard', tabQuery: 'scorecard' },
  { name: 'live-blog', tabQuery: 'live-blog' },
  { name: 'video', tabQuery: 'video' },
  { name: 'commentary', tabQuery: 'commentary' },
  { name: 'news', tabQuery: 'news' },
  { name: 'graphs', tabQuery: 'graphs' },
  { name: 'more', tabQuery: 'more' },
];

export function matchPathForTickerId(prefix: string, tickerId: number): string {
  const normalized = prefix.startsWith('/') ? prefix : `/${prefix}`;
  return `${normalized}${tickerId}`;
}

export function matchUrlWithTab(matchPath: string, tabQuery: string): string {
  return `${matchPath}?tab=${encodeURIComponent(tabQuery)}`;
}

const SETTLE_MS = 900;

export async function settlePage(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(SETTLE_MS);
}

/** Regex matching tab strip labels for this logical tab (e.g. "Video", "video"). */
function tabLabelRegex(tab: MatchTab): RegExp {
  const variants = [tab.name, tab.tabQuery.replace(/-/g, ' ')];
  const escaped = variants.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'i');
}

/**
 * True if a tab control exists for this tab (prod/UAT may expose different sets).
 * If the page exposes **no** `tab` roles, returns true so we still try `?tab=` navigation.
 */
export async function tabStripOffersTab(page: Page, tab: MatchTab): Promise<boolean> {
  const stripCount = await page.getByRole('tab').count();
  if (stripCount === 0) {
    return true;
  }
  const re = tabLabelRegex(tab);
  return (await page.getByRole('tab', { name: re }).count()) > 0;
}

const GOTO_OPTS = { waitUntil: 'domcontentloaded' as const, timeout: 25_000 };

/**
 * Prefer clicking a visible tab or link; otherwise `?tab=` navigation.
 * Throws if navigation fails (caller treats as skip for optional flows).
 */
export async function showMatchTab(page: Page, matchPath: string, tab: MatchTab): Promise<void> {
  const labels = [
    tab.name,
    tab.name.replace(/-/g, ' '),
    tab.tabQuery.replace(/-/g, ' '),
  ];

  for (const label of labels) {
    const re = new RegExp(label, 'i');
    const asTab = page.getByRole('tab', { name: re }).first();
    try {
      await asTab.click({ timeout: 1800 });
      await settlePage(page);
      return;
    } catch {
      // try next strategy
    }
    const asLink = page.getByRole('link', { name: re }).first();
    try {
      await asLink.click({ timeout: 1500 });
      await settlePage(page);
      return;
    } catch {
      // try next strategy
    }
  }

  await page.goto(matchUrlWithTab(matchPath, tab.tabQuery), GOTO_OPTS);
  await settlePage(page);
}
