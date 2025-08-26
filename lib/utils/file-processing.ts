import { createReadStream, promises as fs } from 'fs';
import { Readable } from 'stream';
import { FileMetadata } from './file-utils';

export interface ProcessingOptions {
  chunkSize?: number;
  maxMemoryUsage?: number;
  encoding?: BufferEncoding;
  onChunk?: (chunk: string | Buffer, offset: number) => void;
  onProgress?: (processed: number, total: number) => void;
}

export interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
  isOverLimit: boolean;
}

export interface ProcessingResult {
  content: string | Buffer;
  metadata: FileMetadata;
  memoryUsage: MemoryInfo;
  processingTime: number;
  chunks: number;
}

/**
 * Gets current memory usage information
 */
export function getMemoryUsage(): MemoryInfo {
  const memUsage = process.memoryUsage();
  const used = memUsage.heapUsed;
  const total = memUsage.heapTotal;
  const percentage = (used / total) * 100;
  
  return {
    used,
    total,
    percentage: Math.round(percentage * 100) / 100,
    isOverLimit: false
  };
}

/**
 * Checks if memory usage is within acceptable limits
 */
export function checkMemoryLimit(
  currentUsage: MemoryInfo,
  maxUsage: number
): MemoryInfo {
  return {
    ...currentUsage,
    isOverLimit: currentUsage.used > maxUsage
  };
}

/**
 * Streams file content in chunks for memory-efficient processing
 */
export async function streamFileContent(
  filePath: string,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const {
    chunkSize = 64 * 1024, // 64KB default
    maxMemoryUsage = 100 * 1024 * 1024, // 100MB default
    encoding = 'utf-8',
    onChunk,
    onProgress
  } = options;

  const startTime = Date.now();
  const metadata = await getFileMetadata(filePath);
  let totalProcessed = 0;
  let chunkCount = 0;

  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, {
      highWaterMark: chunkSize,
      encoding: encoding === 'utf-8' ? 'utf-8' : undefined
    });

    let content: string | Buffer = '';
    const chunks: (string | Buffer)[] = [];

    stream.on('data', (chunk: string | Buffer) => {
      // Check memory usage
      const memoryInfo = checkMemoryLimit(getMemoryUsage(), maxMemoryUsage);
      if (memoryInfo.isOverLimit) {
        stream.destroy();
        reject(new Error(`Memory usage limit exceeded: ${memoryInfo.used} bytes`));
        return;
      }

      chunks.push(chunk);
      chunkCount++;
      totalProcessed += chunk.length;

      // Call chunk callback if provided
      if (onChunk) {
        onChunk(chunk, totalProcessed - chunk.length);
      }

      // Call progress callback if provided
      if (onProgress) {
        onProgress(totalProcessed, metadata.size);
      }

      // For text files, accumulate content
      if (typeof chunk === 'string') {
        content += chunk;
      }
    });

    stream.on('end', () => {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      const memoryInfo = getMemoryUsage();

      // For binary files, combine chunks
      if (encoding !== 'utf-8') {
        content = Buffer.concat(chunks as Buffer[]);
      }

      resolve({
        content,
        metadata,
        memoryUsage: memoryInfo,
        processingTime,
        chunks: chunkCount
      });
    });

    stream.on('error', (error) => {
      reject(new Error(`Failed to stream file ${filePath}: ${error.message}`));
    });
  });
}

/**
 * Processes large files in chunks to avoid memory issues
 */
export async function processLargeFile(
  filePath: string,
  processor: (chunk: string | Buffer, offset: number) => Promise<void>,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const {
    chunkSize = 1024 * 1024, // 1MB default
    maxMemoryUsage = 50 * 1024 * 1024, // 50MB default
    encoding = 'utf-8'
  } = options;

  const startTime = Date.now();
  const metadata = await getFileMetadata(filePath);
  let totalProcessed = 0;
  let chunkCount = 0;
  let hasError = false;
  let errorMessage = '';

  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, {
      highWaterMark: chunkSize,
      encoding: encoding === 'utf-8' ? 'utf-8' : undefined
    });

    stream.on('data', async (chunk: string | Buffer) => {
      if (hasError) return; // Skip processing if error occurred

      try {
        // Check memory usage
        const memoryInfo = checkMemoryLimit(getMemoryUsage(), maxMemoryUsage);
        if (memoryInfo.isOverLimit) {
          hasError = true;
          errorMessage = `Memory usage limit exceeded: ${memoryInfo.used} bytes`;
          stream.destroy();
          reject(new Error(errorMessage));
          return;
        }

        // Process the chunk
        await processor(chunk, totalProcessed);
        
        chunkCount++;
        totalProcessed += chunk.length;

        // Pause stream briefly to allow processing
        stream.pause();
        setTimeout(() => stream.resume(), 10);
      } catch (error) {
        hasError = true;
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stream.destroy();
        reject(new Error(errorMessage));
      }
    });

    stream.on('end', () => {
      if (hasError) return; // Don't resolve if error occurred

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      const memoryInfo = getMemoryUsage();

      resolve({
        content: encoding === 'utf-8' ? `Processed ${chunkCount} chunks` : Buffer.alloc(0),
        metadata,
        memoryUsage: memoryInfo,
        processingTime,
        chunks: chunkCount
      });
    });

    stream.on('error', (error) => {
      if (!hasError) {
        reject(new Error(`Failed to process large file ${filePath}: ${error.message}`));
      }
    });
  });
}

/**
 * Reads file content with memory monitoring
 */
export async function readFileWithMemoryMonitoring(
  filePath: string,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const {
    maxMemoryUsage = 100 * 1024 * 1024, // 100MB default
    encoding = 'utf-8'
  } = options;

  const startTime = Date.now();
  const metadata = await getFileMetadata(filePath);
  
  // Check initial memory usage
  const initialMemory = getMemoryUsage();
  if (initialMemory.used > maxMemoryUsage) {
    throw new Error(`Initial memory usage too high: ${initialMemory.used} bytes`);
  }

  // For large files, use streaming
  if (metadata.size > 10 * 1024 * 1024) { // 10MB threshold
    return streamFileContent(filePath, options);
  }

  // For smaller files, read directly
  try {
    const content = await fs.readFile(filePath, { encoding });
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    const finalMemory = getMemoryUsage();

    return {
      content,
      metadata,
      memoryUsage: finalMemory,
      processingTime,
      chunks: 1
    };
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Gets file metadata for processing
 */
async function getFileMetadata(filePath: string): Promise<FileMetadata> {
  const stats = await fs.stat(filePath);
  const relativePath = filePath.split('/').pop() || filePath;
  
  return {
    path: filePath,
    relativePath,
    size: stats.size,
    modificationDate: stats.mtime,
    isDirectory: stats.isDirectory(),
    isSymbolicLink: stats.isSymbolicLink(),
    isFile: stats.isFile()
  };
}

/**
 * Creates a readable stream from file content
 */
export function createFileStream(content: string | Buffer): Readable {
  if (typeof content === 'string') {
    return Readable.from(content);
  } else {
    return Readable.from(content);
  }
}

/**
 * Monitors memory usage during file processing
 */
export class MemoryMonitor {
  private startMemory: MemoryInfo;
  private maxMemory: number;
  private checkpoints: Array<{ name: string; memory: MemoryInfo; timestamp: number }> = [];

  constructor(maxMemory: number = 100 * 1024 * 1024) {
    this.startMemory = getMemoryUsage();
    this.maxMemory = maxMemory;
    this.checkpoint('start');
  }

  checkpoint(name: string): MemoryInfo {
    const memory = getMemoryUsage();
    this.checkpoints.push({
      name,
      memory,
      timestamp: Date.now()
    });
    return memory;
  }

  getReport(): {
    start: MemoryInfo;
    current: MemoryInfo;
    peak: MemoryInfo;
    checkpoints: Array<{ name: string; memory: MemoryInfo; timestamp: number }>;
    isOverLimit: boolean;
  } {
    const current = getMemoryUsage();
    const peak = this.checkpoints.reduce((max, checkpoint) => 
      checkpoint.memory.used > max.used ? checkpoint.memory : max, this.startMemory
    );

    return {
      start: this.startMemory,
      current,
      peak,
      checkpoints: this.checkpoints,
      isOverLimit: current.used > this.maxMemory
    };
  }

  isOverLimit(): boolean {
    return getMemoryUsage().used > this.maxMemory;
  }
}
