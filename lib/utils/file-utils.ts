import { promises as fs } from 'fs';
import { join, resolve, relative } from 'path';

export interface FileMetadata {
  path: string;
  relativePath: string;
  size: number;
  modificationDate: Date;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  isFile: boolean;
}

export interface TraversalOptions {
  maxDepth?: number;
  includeHidden?: boolean;
  fileExtensions?: string[];
  maxFileSize?: number;
  followSymlinks?: boolean;
}

export interface TraversalResult {
  files: FileMetadata[];
  directories: FileMetadata[];
  errors: string[];
  totalSize: number;
}



/**
 * Gets file metadata safely with error handling
 */
async function getFileMetadata(filePath: string, basePath: string): Promise<FileMetadata | null> {
  try {
    const stats = await fs.stat(filePath);
    const relativePath = relative(basePath, filePath);
    
    return {
      path: filePath,
      relativePath,
      size: stats.size,
      modificationDate: stats.mtime,
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
      isFile: stats.isFile()
    };
  } catch (error) {
    console.warn(`Failed to get metadata for ${filePath}:`, error);
    return null;
  }
}

/**
 * Checks if a file should be included based on traversal options
 */
function shouldIncludeFile(file: FileMetadata, options: TraversalOptions): boolean {
  // Skip hidden files unless explicitly included
  if (!options.includeHidden && file.relativePath.includes('/.')) {
    // Only skip if it's actually a hidden file (starts with .)
    const pathParts = file.relativePath.split('/');
    if (pathParts.some(part => part.startsWith('.'))) {
      return false;
    }
  }

  // Skip if file size exceeds limit
  if (options.maxFileSize && file.size > options.maxFileSize) {
    return false;
  }

  // Skip if file extensions are specified and file doesn't match
  if (options.fileExtensions && options.fileExtensions.length > 0) {
    const ext = file.relativePath.split('.').pop()?.toLowerCase();
    if (!ext || !options.fileExtensions.includes(ext)) {
      return false;
    }
  }

  return true;
}

/**
 * Recursively traverses a directory structure
 */
export async function traverseDirectory(
  rootPath: string,
  options: TraversalOptions = {}
): Promise<TraversalResult> {
  const {
    maxDepth = 10,
    followSymlinks = false
  } = options;

  const result: TraversalResult = {
    files: [],
    directories: [],
    errors: [],
    totalSize: 0
  };

  const basePath = resolve(rootPath);
  
  async function traverse(currentPath: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      return;
    }

    try {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        const fullPath = join(currentPath, item);
        
        try {
          const metadata = await getFileMetadata(fullPath, basePath);
          if (!metadata) continue;

          if (metadata.isDirectory) {
            result.directories.push(metadata);
            if (depth + 1 <= maxDepth) {
              await traverse(fullPath, depth + 1);
            }
          } else if (metadata.isSymbolicLink) {
            if (followSymlinks) {
              try {
                const realPath = await fs.realpath(fullPath);
                const realMetadata = await getFileMetadata(realPath, basePath);
                if (realMetadata && shouldIncludeFile(realMetadata, options)) {
                  result.files.push(realMetadata);
                  result.totalSize += realMetadata.size;
                }
              } catch (error) {
                result.errors.push(`Failed to follow symlink ${fullPath}: ${error}`);
              }
            }
          } else if (metadata.isFile && shouldIncludeFile(metadata, options)) {
            result.files.push(metadata);
            result.totalSize += metadata.size;
          }
        } catch (error) {
          result.errors.push(`Failed to process ${fullPath}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to read directory ${currentPath}: ${error}`);
    }
  }

  await traverse(rootPath, 0);
  return result;
}

/**
 * Gets file content with encoding detection
 */
export async function readFileContent(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
  try {
    const content = await fs.readFile(filePath, { encoding });
    return content;
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Gets file content as buffer for binary files
 */
export async function readFileBuffer(filePath: string): Promise<Buffer> {
  try {
    const content = await fs.readFile(filePath);
    return content;
  } catch (error) {
    throw new Error(`Failed to read file buffer ${filePath}: ${error}`);
  }
}

/**
 * Checks if a file is a text file based on extension
 */
export function isTextFile(filePath: string): boolean {
  const textExtensions = [
    'ts', 'tsx', 'js', 'jsx', 'json', 'md', 'txt', 'yml', 'yaml',
    'xml', 'html', 'css', 'scss', 'less', 'sql', 'sh', 'bat', 'ps1'
  ];
  
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext ? textExtensions.includes(ext) : false;
}

/**
 * Gets file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
