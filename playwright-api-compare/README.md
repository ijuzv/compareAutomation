# Playwright API Compare Framework

Enterprise-grade Playwright automation framework for comparing two different API versions of a mobile application in parallel.

## Architecture & Features

- **Page Object Model (POM)**: For robust and reusable UI interactions.
- **Data-Driven Fixtures**: Dynamically loaded tests from JSON (`data/dynamic-fixtures.json`).
- **Parallel Execution**: Uses Playwright workers to run V1 and V2 identical flows simultaneously.
- **Visual Regression**: Captures screenshots and compares them using `pixelmatch`.
- **API Interception**: Automatically tracks, captures, and compares API payloads and responses.
- **Continuous Execution (Scheduler)**: Built-in Node scheduler (`scripts/scheduler.ts`) to run tests at specific intervals (e.g., every 5 minutes).
- **Containerized**: Ready to be deployed via Docker and `docker-compose`.
- **CI/CD Ready**: GitHub Actions workflow included.

## Folder Structure

\`\`\`
playwright-api-compare/
├── tests/
│   ├── fixtures/       # Custom Playwright fixtures extending the base test
│   ├── flows/          # Reusable logical business flows
│   ├── pages/          # Page Object Models
│   ├── specs/          # Playwright test specifications
├── screenshots/
│   ├── v1/             # Screenshots of V1
│   ├── v2/             # Screenshots of V2
│   ├── diff/           # Visual comparison differences (pixelmatch outputs)
├── reports/            # HTML and JSON Playwright reports
├── logs/               # API JSON logs and Winston application logs
├── configs/            # Environment configurations (.env.v1, .env.v2)
├── utils/              # Helper utilities (Logger, VisualComparator, ApiInterceptor)
├── data/               # Static and dynamic JSON fixtures
├── scripts/            # Node scripts (e.g., scheduler)
├── docker-compose.yml
├── Dockerfile
└── package.json
\`\`\`

## Getting Started

### 1. Installation

\`\`\`bash
npm install
npx playwright install
\`\`\`

### 2. Configuration

Review the `.env.v1` and `.env.v2` files located in the `configs/` directory.

\`\`\`env
BASE_URL_V1=https://app-v1.example.com
API_URL_V1=https://api-v1.example.com
SCREENSHOT_INTERVAL=300000
WORKERS=4
HEADLESS=true
DEVICE=Desktop Chrome
\`\`\`

### 3. Running Tests Locally

Run a standard Playwright test execution:

\`\`\`bash
npm run test
\`\`\`

Run tests with UI mode:

\`\`\`bash
npm run test:ui
\`\`\`

### 4. Running the Continuous Scheduler

If you want the framework to run tests indefinitely at an interval (e.g., every 5 minutes):

\`\`\`bash
npm run scheduler
\`\`\`

### 5. Running with Docker

Build and run the entire suite as a background service:

\`\`\`bash
docker-compose up --build -d
\`\`\`

Logs, reports, and screenshots will be mapped to your host machine automatically.
