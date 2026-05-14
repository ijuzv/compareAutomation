import { execSync } from 'child_process';
import { Options } from '@wdio/types';
import { dismissAndroidSystemSheets } from './tests/helpers/ui';

function logEmulatorDiscovery(capabilities: Options.Testrunner['capabilities']) {
    const caps = (capabilities ?? []) as Record<string, unknown>[];
    const expectedIds = caps
        .map((c) => {
            const udid = c['appium:udid'];
            if (typeof udid === 'string' && udid.length > 0) {
                return udid;
            }
            const deviceName = c['appium:deviceName'];
            return typeof deviceName === 'string' && deviceName.length > 0 ? deviceName : null;
        })
        .filter((id): id is string => Boolean(id));

    console.log('\n========== Emulator / device discovery ==========');
    let adbList = '';
    try {
        adbList = execSync('adb devices -l', { encoding: 'utf-8' }).trim();
        console.log(adbList);
    } catch {
        console.log('Could not run "adb devices -l". Is Android platform-tools on PATH?');
        console.log('==================================================\n');
        return;
    }

    const deviceLines = adbList
        .split('\n')
        .slice(1)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('*'));

    const onlineIds = deviceLines
        .map((line) => line.split(/\s+/)[0])
        .filter((id) => id && id !== 'List');

    for (const id of expectedIds) {
        const found = onlineIds.includes(id);
        console.log(`Capability device "${id}": ${found ? 'FOUND in adb output' : 'NOT FOUND (not connected or wrong serial)'}`);
    }
    if (expectedIds.length === 0) {
        console.log('No appium:udid or appium:deviceName entries in capabilities to match.');
    }
    console.log(`Summary: ${onlineIds.length} device(s) online per adb; ${expectedIds.length} expected from config.`);
    console.log('==================================================\n');
}

export const config: Options.Testrunner = {
    runner: 'local',
    autoCompileOpts: {
        autoCompile: true,
        tsNodeOpts: {
            project: './tsconfig.json',
            transpileOnly: true
        }
    },
    port: 4723,
    specs: [
        './tests/specs/**/*.ts'
    ],
    maxInstances: 2,
    // Parallel UiAutomator2: set appium:udid per worker (else sessions pile onto one device) and
    // unique appium:systemPort per device (else forwarding / instrumentation conflicts).
    capabilities: [
        {
            platformName: 'Android',
            'appium:deviceName': 'emulator-5554',
            'appium:udid': 'emulator-5554',
            'appium:systemPort': 8200,
            'appium:automationName': 'UiAutomator2',
            'appium:appPackage': 'au.com.cricket',
            'appium:appActivity': '.ui.SplashActivity',
            'appium:noReset': true,
            'appium:autoGrantPermissions': true,
            'appium:disableWindowAnimation': true,
            'appium:newCommandTimeout': 240,
        },
        {
            platformName: 'Android',
            'appium:deviceName': 'emulator-5556',
            'appium:udid': 'emulator-5556',
            'appium:systemPort': 8201,
            'appium:automationName': 'UiAutomator2',
            'appium:appPackage': 'au.com.cricket',
            'appium:appActivity': '.ui.SplashActivity',
            'appium:noReset': true,
            'appium:autoGrantPermissions': true,
            'appium:disableWindowAnimation': true,
            'appium:newCommandTimeout': 240,
        },
    ],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 600000
    },
    /**
     * Runs once per worker after the session (and app) start — catches system sheets
     * (Don't show again, Don't allow, etc.) before suite hooks.
     */
    before: async () => {
        await dismissAndroidSystemSheets(16);
    },
    onPrepare: (_config, capabilities) => {
        logEmulatorDiscovery(capabilities);
    },
}
