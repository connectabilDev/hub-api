import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  QueueName,
  MediaJobData,
} from '../../../shared/infrastructure/queue/queue.types';

@Injectable()
@Processor(QueueName.MEDIA)
export class MediaProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaProcessor.name);

  constructor(
    @InjectQueue(QueueName.MEDIA)
    private readonly mediaQueue: Queue<MediaJobData>,
  ) {
    super();
  }

  async process(job: Job<MediaJobData>): Promise<void> {
    this.logger.log(
      `Processing media job: ${job.name} for file ${job.data.fileId}`,
    );

    try {
      switch (job.name) {
        case 'process-media':
          await this.handleProcessMedia(job.data);
          break;
        default:
          this.logger.warn(`Unknown media job type: ${job.name}`);
      }

      this.logger.log(`Successfully processed media job: ${job.name}`);
    } catch (error) {
      this.logger.error(`Failed to process media job: ${job.name}`, error);
      throw error;
    }
  }

  private async handleProcessMedia(data: MediaJobData): Promise<void> {
    this.logger.log(
      `Processing media file: ${data.filePath} for user ${data.userId}`,
    );

    switch (data.type) {
      case 'image_resize':
        await this.processImageResize(data);
        break;
      case 'video_compress':
        await this.processVideoCompression(data);
        break;
      case 'audio_transcribe':
        await this.processAudioTranscription(data);
        break;
      default:
        this.logger.warn(
          `Unknown media processing type: ${data.type as string}`,
        );
    }
  }

  private async processImageResize(data: MediaJobData): Promise<void> {
    const {
      sizes = [150, 300, 600],
      quality = 85,
      format = 'webp',
    } = data.options;

    this.logger.log(
      `Resizing image ${data.fileId} to sizes: ${sizes.join(', ')}`,
    );

    for (const size of sizes) {
      await this.resizeImage(data.fileId, size, quality, format);
    }

    await this.generateThumbnail(data.fileId, 150, quality, format);

    await this.uploadToS3(data.fileId, data.userId);

    this.logger.log(`Image processing completed for ${data.fileId}`);
  }

  private async processVideoCompression(data: MediaJobData): Promise<void> {
    const { quality = 75 } = data.options;

    this.logger.log(
      `Compressing video ${data.fileId} with quality ${quality}%`,
    );

    await this.compressVideo(data.fileId, quality);

    await this.generateVideoThumbnail(data.fileId);

    await this.uploadToS3(data.fileId, data.userId);

    this.logger.log(`Video processing completed for ${data.fileId}`);
  }

  private async processAudioTranscription(data: MediaJobData): Promise<void> {
    this.logger.log(`Transcribing audio ${data.fileId}`);

    const transcription = await this.transcribeAudio(data.fileId);

    this.saveTranscription(data.fileId, transcription);

    await this.uploadToS3(data.fileId, data.userId);

    this.logger.log(`Audio transcription completed for ${data.fileId}`);
  }

  private async resizeImage(
    fileId: string,
    size: number,
    quality: number,
    format: string,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.logger.log(
      `Mock: Resized image ${fileId} to ${size}x${size} with quality ${quality}% in ${format} format`,
    );
  }

  private async generateThumbnail(
    fileId: string,
    size: number,
    _quality: number,
    _format: string,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    this.logger.log(
      `Mock: Generated thumbnail for ${fileId} at ${size}x${size}`,
    );
  }

  private async compressVideo(fileId: string, quality: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.logger.log(
      `Mock: Compressed video ${fileId} with ${quality}% quality`,
    );
  }

  private async generateVideoThumbnail(fileId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    this.logger.log(`Mock: Generated video thumbnail for ${fileId}`);
  }

  private async transcribeAudio(fileId: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockTranscription = `Mock transcription for audio file ${fileId}. This is a sample transcription text.`;

    this.logger.log(`Mock: Transcribed audio ${fileId}`);

    return mockTranscription;
  }

  private saveTranscription(fileId: string, transcription: string): void {
    this.logger.log(
      `Mock: Saved transcription for ${fileId} (${transcription.length} characters)`,
    );
  }

  private async uploadToS3(fileId: string, userId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockS3Key = `users/${userId}/media/${fileId}`;
    const mockS3Url = `https://mock-bucket.s3.amazonaws.com/${mockS3Key}`;

    this.logger.log(`Mock: Uploaded ${fileId} to S3 at ${mockS3Url}`);

    this.updateMediaRecord(fileId, mockS3Url);
  }

  private updateMediaRecord(fileId: string, s3Url: string): void {
    this.logger.log(
      `Mock: Updated media record ${fileId} with S3 URL: ${s3Url}`,
    );
  }
}
