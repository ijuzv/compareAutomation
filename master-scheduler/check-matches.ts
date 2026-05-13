import { FixtureFetcher } from '../common-utils/fixtureFetcher';
import * as fs from 'fs';

async function run() {
    const activeMatches = await FixtureFetcher.getActiveMatchIds();
    
    if (activeMatches.length > 0) {
        console.log(`Active matches found: ${activeMatches.join(', ')}`);
        
        // Write to GitHub Actions output file
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_matches=true\n`);
        } else {
            console.log('has_matches=true');
        }
        process.exit(0);
    } else {
        console.log('No active matches right now.');
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_matches=false\n`);
        } else {
            console.log('has_matches=false');
        }
        process.exit(0);
    }
}

run();
