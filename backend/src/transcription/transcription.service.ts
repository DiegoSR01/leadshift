import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execFileAsync = promisify(execFile);

export interface TranscriptionResult {
  text: string;
  language: string;
  languageProbability?: number;
  duration?: number;
  segments: { start: number; end: number; text: string }[];
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly scriptPath: string;
  private available: boolean | null = null;

  constructor() {
    this.scriptPath = path.resolve(__dirname, '../../scripts/transcribe.py');
  }

  /**
   * Check if Whisper transcription is available (Python + faster-whisper installed)
   */
  async isAvailable(): Promise<boolean> {
    if (this.available !== null) return this.available;

    try {
      // Check if Python is accessible
      await execFileAsync('python', ['--version'], { timeout: 5000 });

      // Check if faster-whisper is installed
      await execFileAsync('python', ['-c', 'import faster_whisper'], { timeout: 5000 });

      // Check if script exists
      if (!fs.existsSync(this.scriptPath)) {
        this.logger.warn(`Transcription script not found at ${this.scriptPath}`);
        this.available = false;
        return false;
      }

      this.available = true;
      this.logger.log('Whisper transcription is available');
      return true;
    } catch {
      this.logger.warn('Whisper transcription is NOT available (Python or faster-whisper missing)');
      this.available = false;
      return false;
    }
  }

  /**
   * Transcribe an audio file using faster-whisper
   */
  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        'python',
        [this.scriptPath, audioFilePath],
        { timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
      );

      if (stderr) {
        this.logger.warn(`Whisper stderr: ${stderr}`);
      }

      const result = JSON.parse(stdout);

      if (result.error) {
        throw new Error(`Whisper error: ${result.error}`);
      }

      return result as TranscriptionResult;
    } catch (err: any) {
      this.logger.error(`Transcription failed: ${err.message}`);
      throw new Error(`Transcription failed: ${err.message}`);
    }
  }

  /**
   * Transcribe from a Buffer (saves to temp file, transcribes, cleans up)
   */
  async transcribeBuffer(buffer: Buffer, originalName?: string): Promise<TranscriptionResult> {
    const ext = originalName ? path.extname(originalName) : '.webm';
    const tmpDir = path.resolve(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tmpFile = path.join(tmpDir, `audio_${Date.now()}${ext}`);

    try {
      fs.writeFileSync(tmpFile, buffer);
      const result = await this.transcribe(tmpFile);
      return result;
    } finally {
      // Clean up temp file
      try {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
