import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class HelpService {
  private readonly helpBasePath = join(process.cwd(), 'content/help');

  async getHelpContent(moduleKey: string, lang: string = 'vi'): Promise<string> {
    const filePath = join(this.helpBasePath, lang, `${moduleKey}.md`);
    
    try {
      // Security check: ensure the path is within the helpBasePath
      const absolutePath = join(this.helpBasePath, lang, `${moduleKey}.md`);
      if (!absolutePath.startsWith(this.helpBasePath)) {
        throw new Error('Access denied');
      }

      const content = await fs.readFile(absolutePath, 'utf-8');
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`Help content for module "${moduleKey}" not found in language "${lang}".`);
      }
      throw error;
    }
  }
}
