import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { TranscriptionService } from './transcription.service';

@Controller('api/transcribe')
@UseGuards(AuthGuard('jwt'))
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  /**
   * GET /api/transcribe/status
   * Check if Whisper transcription is available
   */
  @Get('status')
  async getStatus() {
    const available = await this.transcriptionService.isAvailable();
    return { available };
  }

  /**
   * POST /api/transcribe
   * Upload an audio file and get transcription
   * Expects multipart/form-data with field name "audio"
   */
  @Post()
  @UseInterceptors(FileInterceptor('audio'))
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No audio file provided. Send as multipart/form-data with field "audio".');
    }

    const available = await this.transcriptionService.isAvailable();
    if (!available) {
      throw new BadRequestException(
        'Whisper transcription is not available. Ensure Python and faster-whisper are installed.',
      );
    }

    const result = await this.transcriptionService.transcribeBuffer(
      file.buffer,
      file.originalname,
    );

    return {
      text: result.text,
      language: result.language,
      duration: result.duration,
      segments: result.segments,
    };
  }
}
