import { Page, Request, Response } from '@playwright/test';
import * as fs from 'fs-extra';
import * as path from 'path';
import { logger } from './logger';

export interface ApiLog {
  url: string;
  method: string;
  status: number;
  requestPayload: any;
  responsePayload: any;
  responseTimeMs: number;
}

export class ApiInterceptor {
  private logs: Map<string, ApiLog> = new Map();
  private requestTimestamps: Map<string, number> = new Map();

  constructor(private page: Page, private apiBaseUrl: string) {}

  async startIntercepting() {
    this.page.on('request', async (request: Request) => {
      const url = request.url();
      if (url.includes(this.apiBaseUrl)) {
        this.requestTimestamps.set(url, Date.now());
        const postData = request.postDataJSON() || request.postData();
        this.logs.set(url, {
          url,
          method: request.method(),
          status: 0,
          requestPayload: postData,
          responsePayload: null,
          responseTimeMs: 0
        });
      }
    });

    this.page.on('response', async (response: Response) => {
      const url = response.url();
      if (url.includes(this.apiBaseUrl) && this.logs.has(url)) {
        const log = this.logs.get(url)!;
        log.status = response.status();
        
        try {
          const body = await response.json();
          log.responsePayload = body;
        } catch (e) {
          try {
            log.responsePayload = await response.text();
          } catch (textErr) {
            log.responsePayload = 'Could not parse response body';
          }
        }

        const startTime = this.requestTimestamps.get(url) || Date.now();
        log.responseTimeMs = Date.now() - startTime;
        
        this.logs.set(url, log);
      }
    });
  }

  getLogs(): ApiLog[] {
    return Array.from(this.logs.values());
  }

  async saveLogs(filePath: string) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJSON(filePath, this.getLogs(), { spaces: 2 });
    logger.info(`Saved API logs to ${filePath}`);
  }

  static compareLogs(logV1: ApiLog[], logV2: ApiLog[]): any[] {
    const mismatches: any[] = [];
    
    logV1.forEach(v1 => {
      const v2 = logV2.find(v => v.url.endsWith(new URL(v1.url).pathname));
      if (!v2) {
        mismatches.push({ type: 'MISSING_IN_V2', url: v1.url });
        return;
      }
      if (v1.status !== v2.status) {
        mismatches.push({ type: 'STATUS_MISMATCH', url: v1.url, v1Status: v1.status, v2Status: v2.status });
      }
      if (JSON.stringify(v1.responsePayload) !== JSON.stringify(v2.responsePayload)) {
        mismatches.push({ type: 'PAYLOAD_MISMATCH', url: v1.url, v1Payload: v1.responsePayload, v2Payload: v2.responsePayload });
      }
    });

    return mismatches;
  }
}
