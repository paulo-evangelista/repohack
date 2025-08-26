import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { 
  traverseDirectory, 
  readFileContent, 
  readFileBuffer, 
  isTextFile, 
  formatFileSize,
  FileMetadata,
  TraversalOptions 
} from '../../../lib/utils/file-utils';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    stat: vi.fn(),
    access: vi.fn(),
    readFile: vi.fn(),
    realpath: vi.fn()
  },
  constants: {
    R_OK: 4
  }
}));

const mockFs = vi.mocked(fs);

describe('File Utils', () => {
  const mockBasePath = '/test/repo';
  const mockFilePath = '/test/repo/src/index.ts';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('traverseDirectory', () => {
    it('should traverse directory structure successfully', async () => {
      const mockFiles = [
        { name: 'src', isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, size: 0, mtime: new Date() },
        { name: 'package.json', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false, size: 1024, mtime: new Date() }
      ];

      const mockSrcFiles = [
        { name: 'index.ts', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false, size: 2048, mtime: new Date() }
      ];

      mockFs.readdir
        .mockResolvedValueOnce(['src', 'package.json'] as any)
        .mockResolvedValueOnce(['index.ts'] as any);

      mockFs.stat
        .mockResolvedValueOnce(mockFiles[0] as any)
        .mockResolvedValueOnce(mockFiles[1] as any)
        .mockResolvedValueOnce(mockSrcFiles[0] as any);

      const result = await traverseDirectory(mockBasePath);

      expect(result.files).toHaveLength(2);
      expect(result.directories).toHaveLength(1);
      expect(result.totalSize).toBe(3072);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle directory traversal errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const result = await traverseDirectory(mockBasePath);

      expect(result.files).toHaveLength(0);
      expect(result.directories).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to read directory');
    });

    it('should respect maxDepth option', async () => {
      const mockFiles = [
        { name: 'src', isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false, size: 0, mtime: new Date() }
      ];

      mockFs.readdir
        .mockResolvedValueOnce(['src'] as any)
        .mockResolvedValueOnce([] as any);
      mockFs.stat.mockResolvedValue(mockFiles[0] as any);

      const options: TraversalOptions = { maxDepth: 1 };
      const result = await traverseDirectory(mockBasePath, options);

      expect(mockFs.readdir).toHaveBeenCalledTimes(2);
      expect(result.directories).toHaveLength(1);
    });

    it('should handle symbolic links when followSymlinks is true', async () => {
      const mockSymlink = { 
        name: 'link', 
        isDirectory: () => false, 
        isFile: () => false, 
        isSymbolicLink: () => true, 
        size: 0, 
        mtime: new Date() 
      };

      const mockTargetFile = { 
        name: 'target.txt', 
        isDirectory: () => false, 
        isFile: () => true, 
        isSymbolicLink: () => false, 
        size: 512, 
        mtime: new Date() 
      };

      mockFs.readdir.mockResolvedValue(['link'] as any);
      mockFs.stat
        .mockResolvedValueOnce(mockSymlink as any)
        .mockResolvedValueOnce(mockTargetFile as any);
      mockFs.realpath.mockResolvedValue('/test/repo/target.txt');

      const options: TraversalOptions = { followSymlinks: true };
      const result = await traverseDirectory(mockBasePath, options);

      expect(result.files).toHaveLength(1);
      expect(result.totalSize).toBe(512);
    });

    it('should filter files by extension', async () => {
      const mockFiles = [
        { name: 'index.ts', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false, size: 1024, mtime: new Date() },
        { name: 'style.css', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false, size: 512, mtime: new Date() }
      ];

      mockFs.readdir.mockResolvedValue(['index.ts', 'style.css'] as any);
      mockFs.stat
        .mockResolvedValueOnce(mockFiles[0] as any)
        .mockResolvedValueOnce(mockFiles[1] as any);

      const options: TraversalOptions = { fileExtensions: ['ts'] };
      const result = await traverseDirectory(mockBasePath, options);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].relativePath).toBe('index.ts');
    });

    it('should filter files by size', async () => {
      const mockFiles = [
        { name: 'small.txt', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false, size: 100, mtime: new Date() },
        { name: 'large.txt', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false, size: 2048, mtime: new Date() }
      ];

      mockFs.readdir.mockResolvedValue(['small.txt', 'large.txt'] as any);
      mockFs.stat
        .mockResolvedValueOnce(mockFiles[0] as any)
        .mockResolvedValueOnce(mockFiles[1] as any);

      const options: TraversalOptions = { maxFileSize: 1000 };
      const result = await traverseDirectory(mockBasePath, options);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].relativePath).toBe('small.txt');
    });
  });

  describe('readFileContent', () => {
    it('should read file content with specified encoding', async () => {
      const mockContent = 'console.log("Hello World");';
      mockFs.readFile.mockResolvedValue(mockContent as any);

      const result = await readFileContent(mockFilePath, 'utf-8');

      expect(result).toBe(mockContent);
      expect(mockFs.readFile).toHaveBeenCalledWith(mockFilePath, { encoding: 'utf-8' });
    });

    it('should throw error when file read fails', async () => {
      const error = new Error('File not found');
      mockFs.readFile.mockRejectedValue(error);

      await expect(readFileContent(mockFilePath)).rejects.toThrow('Failed to read file');
    });
  });

  describe('readFileBuffer', () => {
    it('should read file as buffer', async () => {
      const mockBuffer = Buffer.from('binary content');
      mockFs.readFile.mockResolvedValue(mockBuffer as any);

      const result = await readFileBuffer(mockFilePath);

      expect(result).toEqual(mockBuffer);
      expect(mockFs.readFile).toHaveBeenCalledWith(mockFilePath);
    });

    it('should throw error when file read fails', async () => {
      const error = new Error('File not found');
      mockFs.readFile.mockRejectedValue(error);

      await expect(readFileBuffer(mockFilePath)).rejects.toThrow('Failed to read file buffer');
    });
  });

  describe('isTextFile', () => {
    it('should identify TypeScript files as text files', () => {
      expect(isTextFile('index.ts')).toBe(true);
      expect(isTextFile('component.tsx')).toBe(true);
    });

    it('should identify JavaScript files as text files', () => {
      expect(isTextFile('script.js')).toBe(true);
      expect(isTextFile('app.jsx')).toBe(true);
    });

    it('should identify configuration files as text files', () => {
      expect(isTextFile('package.json')).toBe(true);
      expect(isTextFile('tsconfig.json')).toBe(true);
      expect(isTextFile('README.md')).toBe(true);
    });

    it('should identify non-text files as false', () => {
      expect(isTextFile('image.png')).toBe(false);
      expect(isTextFile('document.pdf')).toBe(false);
      expect(isTextFile('archive.zip')).toBe(false);
    });

    it('should handle files without extensions', () => {
      expect(isTextFile('Dockerfile')).toBe(false);
      expect(isTextFile('Makefile')).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal sizes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
    });

    it('should handle very large sizes', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });
  });

  describe('FileMetadata interface', () => {
    it('should have correct structure', () => {
      const metadata: FileMetadata = {
        path: '/test/repo/src/index.ts',
        relativePath: 'src/index.ts',
        size: 1024,
        modificationDate: new Date(),
        isDirectory: false,
        isSymbolicLink: false,
        isFile: true
      };

      expect(metadata.path).toBe('/test/repo/src/index.ts');
      expect(metadata.relativePath).toBe('src/index.ts');
      expect(metadata.size).toBe(1024);
      expect(metadata.isDirectory).toBe(false);
      expect(metadata.isSymbolicLink).toBe(false);
      expect(metadata.isFile).toBe(true);
    });
  });

  describe('TraversalOptions interface', () => {
    it('should have correct structure', () => {
      const options: TraversalOptions = {
        maxDepth: 5,
        includeHidden: true,
        fileExtensions: ['ts', 'js'],
        maxFileSize: 1024 * 1024,
        followSymlinks: true
      };

      expect(options.maxDepth).toBe(5);
      expect(options.includeHidden).toBe(true);
      expect(options.fileExtensions).toEqual(['ts', 'js']);
      expect(options.maxFileSize).toBe(1024 * 1024);
      expect(options.followSymlinks).toBe(true);
    });
  });
});
