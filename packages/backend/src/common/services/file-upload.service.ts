import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_PREVIEW_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
];

const ALLOWED_FINAL_MIME = ['application/pdf'];

const ALLOWED_PREVIEW_EXT = ['.pdf', '.docx', '.xlsx', '.doc', '.xls'];
const ALLOWED_FINAL_EXT = ['.pdf'];

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export interface UploadedFileInfo {
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  validatePreviewFile(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException('No file uploaded');
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 20MB limit');
    }
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_PREVIEW_EXT.includes(ext)) {
      throw new BadRequestException(
        `Invalid file type. Allowed for preview: ${ALLOWED_PREVIEW_EXT.join(', ')}`,
      );
    }
    if (!ALLOWED_PREVIEW_MIME.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid MIME type: ${file.mimetype}`);
    }
  }

  validateFinalFile(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException('No file uploaded');
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 20MB limit');
    }
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_FINAL_EXT.includes(ext)) {
      throw new BadRequestException('Final documents must be PDF only (.pdf)');
    }
    if (!ALLOWED_FINAL_MIME.includes(file.mimetype)) {
      throw new BadRequestException(`Final documents must be PDF. Got: ${file.mimetype}`);
    }
  }

  saveFile(file: Express.Multer.File, subDir: string): UploadedFileInfo {
    const dir = join(this.uploadDir, subDir);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const ext = extname(file.originalname).toLowerCase();
    const filename = `${randomUUID()}${ext}`;
    const fullPath = join(dir, filename);
    writeFileSync(fullPath, file.buffer);
    return {
      path: join(subDir, filename),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  getAbsolutePath(relativePath: string): string {
    return join(this.uploadDir, relativePath);
  }
}
