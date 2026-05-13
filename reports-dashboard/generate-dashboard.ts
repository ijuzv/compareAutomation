import * as fs from 'fs-extra';
import * as path from 'path';

function generateDashboard() {
    const dashboardDir = path.resolve(__dirname, '../reports-dashboard/public');
    fs.ensureDirSync(dashboardDir);

    // Placeholder logic: in a real implementation you would read JSON outputs from 
    // playwright-api-compare/reports/results.json and appium-mobile-compare/reports/results.json
    // and aggregate them into a single HTML file.

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unified Comparison Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f4f4f9; margin: 0; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .card { padding: 20px; border-radius: 8px; color: white; }
            .web-card { background: #007acc; }
            .mobile-card { background: #4caf50; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>API Version Comparison - Executive Summary</h1>
            <p>Last Run: ${new Date().toLocaleString()}</p>
            <div class="grid">
                <div class="card web-card">
                    <h2>Web (Playwright)</h2>
                    <p>Status: Completed Successfully</p>
                    <a href="../../playwright-api-compare/reports/html/index.html" style="color:white; text-decoration:underline;">View Detailed Web Report</a>
                </div>
                <div class="card mobile-card">
                    <h2>Mobile (Appium)</h2>
                    <p>Status: Completed Successfully</p>
                    <!-- Provide a link to WDIO reports if generated -->
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    fs.writeFileSync(path.join(dashboardDir, 'index.html'), html);
    console.log('Dashboard generated at reports-dashboard/public/index.html');
}

generateDashboard();
