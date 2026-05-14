import { driver } from '@wdio/globals';

type CapabilitiesRecord = Record<string, unknown>;

function readCaps(): CapabilitiesRecord {
    return driver.capabilities as CapabilitiesRecord;
}

/**
 * Resolves the adb serial / emulator id for this worker.
 * Prefer appium:udid when set (required for parallel workers); fall back to appium:deviceName.
 */
export function getSessionDeviceSerial(): string {
    const caps = readCaps();
    const udid = caps['appium:udid'];
    if (typeof udid === 'string' && udid.length > 0) {
        return udid;
    }
    const fromAppium = caps['appium:deviceName'];
    if (typeof fromAppium === 'string' && fromAppium.length > 0) {
        return fromAppium;
    }
    const deviceName = caps.deviceName;
    if (typeof deviceName === 'string' && deviceName.length > 0) {
        return deviceName;
    }
    return 'unknown';
}

/**
 * Infer prod vs uat from emulator serial (emulator-5556 = uat).
 * Override with MOBILE_FORCE_ENV=prod|uat when needed (W3C caps cannot carry custom keys like envName).
 */
export function getSessionEnvName(): 'prod' | 'uat' {
    const forced = process.env.MOBILE_FORCE_ENV;
    if (forced === 'uat' || forced === 'prod') {
        return forced;
    }
    return getSessionDeviceSerial() === 'emulator-5556' ? 'uat' : 'prod';
}
