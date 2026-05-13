import * as fs from 'fs-extra';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { logger } from './logger';

export class VisualComparator {
  static async compareScreenshots(
    v1Path: string,
    v2Path: string,
    diffPath: string,
    threshold: number = 0.1
  ): Promise<{ diffPixels: number; match: boolean }> {
    try {
      await fs.ensureDir(path.dirname(diffPath));

      if (!fs.existsSync(v1Path) || !fs.existsSync(v2Path)) {
        logger.error(`Screenshots missing. V1: ${v1Path}, V2: ${v2Path}`);
        throw new Error('Missing screenshots for comparison');
      }

      const img1 = PNG.sync.read(fs.readFileSync(v1Path));
      const img2 = PNG.sync.read(fs.readFileSync(v2Path));

      const { width, height } = img1;
      
      if (img1.width !== img2.width || img1.height !== img2.height) {
        logger.warn(`Dimension mismatch. V1: ${img1.width}x${img1.height}, V2: ${img2.width}x${img2.height}`);
      }

      const diff = new PNG({ width, height });

      const diffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        { threshold }
      );

      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      const match = diffPixels === 0;

      logger.info(`Visual comparison completed: ${diffPixels} differing pixels.`);
      return { diffPixels, match };
    } catch (error) {
      logger.error(`Error comparing screenshots: ${error}`);
      throw error;
    }
  }
}
