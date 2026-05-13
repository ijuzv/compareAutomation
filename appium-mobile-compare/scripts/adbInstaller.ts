import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Utility to gather all APKs and install them via adb install-multiple
const installApks = (deviceId: string, apksDir: string) => {
    console.log(`Scanning for APKs in ${apksDir}...`);
    
    if (!fs.existsSync(apksDir)) {
        console.error(`Directory not found: ${apksDir}`);
        return;
    }

    const files = fs.readdirSync(apksDir)
        .filter(file => file.endsWith('.apk'))
        .map(file => path.join(apksDir, file));

    if (files.length === 0) {
        console.log(`No APKs found in ${apksDir}`);
        return;
    }

    // Construct install-multiple command
    const apkPaths = files.map(f => `"${f}"`).join(' ');
    const cmd = `adb -s ${deviceId} install-multiple ${apkPaths}`;

    console.log(`\n⏳ Installing APKs on ${deviceId} (This is a silent background install, please wait...)`);
    console.log(`Executing Command: ${cmd}`);
    
    try {
        execSync(cmd, { stdio: 'inherit' });
        console.log(`✅ SUCCESS: APKs successfully installed on ${deviceId}`);
        
        // Verify installation
        console.log(`🔍 Verifying installation on ${deviceId}...`);
        const installedPackageId = process.env.MOBILE_APP_PACKAGE ?? 'au.com.cricket';
        const verifyCmd = `adb -s ${deviceId} shell pm list packages ${installedPackageId}`;
        const result = execSync(verifyCmd).toString();
        if (result.includes(installedPackageId)) {
            console.log(`📱 Verified! Package ${installedPackageId} is installed on ${deviceId}\n`);
        } else {
            console.log(
                `⚠️ Warning: Installation command succeeded, but package ${installedPackageId} was not found on ${deviceId}\n`
            );
        }
    } catch (error) {
        console.error(`❌ FAILED to install APKs on ${deviceId}:`, error);
    }
};

// Example execution (to be called before tests)
const artifactsDir = path.resolve(__dirname, '../artifacts');

console.log('Installing APKs to emulator-5554...');
installApks('emulator-5554', artifactsDir);

console.log('Installing APKs to emulator-5556...');
installApks('emulator-5556', artifactsDir);
