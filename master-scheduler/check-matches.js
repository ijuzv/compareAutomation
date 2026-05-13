const fs = require('fs');

async function getActiveMatchIds() {
  try {
    const url = 'https://apiv2.cricket.com.au/web/matchticker/fixtures?Region=AU&format=json';
    const response = await fetch(url);
    const data = await response.json();
    const fixtures = data?.Fixtures || [];

    const now = new Date();
    const activeIds = [];

    for (const fixture of fixtures) {
      if (!fixture.IsCompleted) {
        const startTime = new Date(fixture.StartDateTime);
        const endTime = new Date(fixture.EndDateTime);

        // If current time is between start and end time
        if (now >= startTime && now <= endTime) {
          activeIds.push(fixture.Id);
        }
      }
    }

    console.log(`Found ${activeIds.length} active matches: ${activeIds.join(', ')}`);
    return activeIds;
  } catch (error) {
    console.error(`Error fetching fixtures: ${error}`);
    return [];
  }
}

async function run() {
  const activeMatches = await getActiveMatchIds();

  if (activeMatches.length > 0) {
    console.log(`Active matches found: ${activeMatches.join(', ')}`);

    // Write to GitHub Actions output file
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_matches=true\n`);
    } else {
      console.log('has_matches=true');
    }
  } else {
    console.log('No active matches right now.');
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_matches=false\n`);
    } else {
      console.log('has_matches=false');
    }
  }
}

run();
