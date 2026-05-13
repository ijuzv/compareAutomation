import { execSync } from 'child_process';
import { Options } from '@wdio/types';

function logEmulatorDiscovery(capabilities: Options.Testrunner['capabilities']) {
    const caps = (capabilities ?? []) as Record<string, unknown>[];
    const expectedIds = caps
        .map((c) => (typeof c['appium:deviceName'] === 'string' ? c['appium:deviceName'] : null))
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
        console.log('No appium:deviceName entries in capabilities to match.');
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
    capabilities: [
        {
            platformName: 'Android',
            'appium:deviceName': 'emulator-5554',
            'appium:automationName': 'UiAutomator2',
            'appium:appPackage': 'au.com.cricket',
            'appium:appActivity': '.ui.SplashActivity',
            'appium:noReset': true,
            'appium:newCommandTimeout': 240,
            // Splash exits quickly; wait for any in-app activity so UiAutomator2 can stabilize
            'appium:appWaitPackage': 'au.com.cricket',
            'appium:appWaitActivity': 'au\\.com\\.cricket\\..*',
            'appium:appWaitDuration': 60000,
            'appium:adbExecTimeout': 120000,
            'appium:uiautomator2ServerInstallTimeout': 120000,
            'appium:uiautomator2ServerLaunchTimeout': 120000,
        },
        {
            platformName: 'Android',
            'appium:deviceName': 'emulator-5556',
            'appium:automationName': 'UiAutomator2',
            'appium:appPackage': 'au.com.cricket',
            'appium:appActivity': '.ui.SplashActivity',
            'appium:noReset': true,
            'appium:newCommandTimeout': 240,
            'appium:appWaitPackage': 'au.com.cricket',
            'appium:appWaitActivity': 'au\\.com\\.cricket\\..*',
            'appium:appWaitDuration': 60000,
            'appium:adbExecTimeout': 120000,
            'appium:uiautomator2ServerInstallTimeout': 120000,
            'appium:uiautomator2ServerLaunchTimeout': 120000,
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
    onPrepare: (_config, capabilities) => {
        logEmulatorDiscovery(capabilities);
    },
}
