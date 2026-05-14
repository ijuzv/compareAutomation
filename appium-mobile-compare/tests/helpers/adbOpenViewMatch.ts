import { execFileSync } from 'child_process';
import { buildMatchDeepLink, MATCH_VIEW_ACTIVITY_COMPONENT } from '../config/appUnderTest';
import { logger } from '../../../common-utils/logger';

function deviceSerialsForMatchAdb(): string[] {
    const raw = process.env.MOBILE_ADB_MATCH_DEVICE_SERIALS?.trim();
    if (raw) {
        return raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    }
    return ['emulator-5554', 'emulator-5556'];
}

/**
 * `adb shell am start -a VIEW -c BROWSABLE -n …SplashActivity -d <matchUrl>` per device (default both emulators).
 */
export function openMatchOnDevicesViaAdbView(matchId: number): void {
    const url = buildMatchDeepLink(matchId);
    const serials = deviceSerialsForMatchAdb();
    for (const serial of serials) {
        const adbArgs = [
            '-s',
            serial,
            'shell',
            'am',
            'start',
            '-a',
            'android.intent.action.VIEW',
            '-c',
            'android.intent.category.BROWSABLE',
            '-n',
            MATCH_VIEW_ACTIVITY_COMPONENT,
            '-d',
            url,
        ];
        const oneLine = `adb ${adbArgs.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`;
        logger.info(`[adb] ${oneLine}`);
        try {
            execFileSync('adb', adbArgs, { encoding: 'utf-8', stdio: 'pipe' });
        } catch (err) {
            logger.warn(
                `[adb] am start failed for ${serial}: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }
}
