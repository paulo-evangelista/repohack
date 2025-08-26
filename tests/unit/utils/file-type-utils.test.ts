import { describe, it, expect } from 'vitest';
import { 
  identifyFileType, 
  filterFilesByType, 
  getFilesByPriority, 
  getCodeFiles, 
  getDependencyFiles,
  isLargeFile,
  getFileStatistics,
  FileTypeInfo,
  FileFilterOptions
} from '../../../lib/utils/file-type-utils';
import { FileMetadata } from '../../../lib/utils/file-utils';

describe('File Type Utils', () => {
  const createMockFile = (relativePath: string, size: number = 1024): FileMetadata => ({
    path: `/test/repo/${relativePath}`,
    relativePath,
    size,
    modificationDate: new Date(),
    isDirectory: false,
    isSymbolicLink: false,
    isFile: true
  });

  describe('identifyFileType', () => {
    it('should identify TypeScript files as high priority code', () => {
      const result = identifyFileType('src/index.ts');
      expect(result.category).toBe('code');
      expect(result.language).toBe('TypeScript');
      expect(result.priority).toBe('high');
      expect(result.isDependencyFile).toBe(false);
      expect(result.isLockFile).toBe(false);
      expect(result.isConfigFile).toBe(false);
    });

    it('should identify JavaScript files as high priority code', () => {
      const result = identifyFileType('src/app.js');
      expect(result.category).toBe('code');
      expect(result.language).toBe('JavaScript');
      expect(result.priority).toBe('high');
    });

    it('should identify React files correctly', () => {
      const tsxResult = identifyFileType('components/Button.tsx');
      expect(tsxResult.language).toBe('TypeScript React');
      expect(tsxResult.priority).toBe('high');

      const jsxResult = identifyFileType('components/Button.jsx');
      expect(jsxResult.language).toBe('JavaScript React');
      expect(jsxResult.priority).toBe('high');
    });

    it('should identify Python files as medium priority code', () => {
      const result = identifyFileType('src/main.py');
      expect(result.category).toBe('code');
      expect(result.language).toBe('Python');
      expect(result.priority).toBe('medium');
    });

    it('should identify package.json as dependency file', () => {
      const result = identifyFileType('package.json');
      expect(result.category).toBe('config');
      expect(result.language).toBe('Dependency Configuration');
      expect(result.priority).toBe('high');
      expect(result.isDependencyFile).toBe(true);
      expect(result.isLockFile).toBe(false);
      expect(result.isConfigFile).toBe(true);
    });

    it('should identify lock files correctly', () => {
      const pnpmResult = identifyFileType('pnpm-lock.yaml');
      expect(pnpmResult.isLockFile).toBe(true);
      expect(pnpmResult.isDependencyFile).toBe(false);

      const yarnResult = identifyFileType('yarn.lock');
      expect(yarnResult.isLockFile).toBe(true);
      expect(yarnResult.isDependencyFile).toBe(false);
    });

    it('should identify configuration files', () => {
      const jsonResult = identifyFileType('tsconfig.json');
      expect(jsonResult.category).toBe('config');
      expect(jsonResult.language).toBe('JSON');

      const yamlResult = identifyFileType('docker-compose.yml');
      expect(yamlResult.category).toBe('config');
      expect(yamlResult.language).toBe('YAML');
    });

    it('should identify document files', () => {
      const mdResult = identifyFileType('README.md');
      expect(mdResult.category).toBe('document');
      expect(mdResult.language).toBe('Markdown');
      expect(mdResult.priority).toBe('low');

      const txtResult = identifyFileType('LICENSE.txt');
      expect(txtResult.category).toBe('document');
      expect(txtResult.language).toBe('Text');
    });

    it('should handle files without extensions', () => {
      const result = identifyFileType('Dockerfile');
      expect(result.category).toBe('other');
      expect(result.priority).toBe('low');
    });

    it('should handle files with multiple dots', () => {
      const result = identifyFileType('config.prod.json');
      expect(result.category).toBe('config');
      expect(result.language).toBe('JSON');
    });
  });

  describe('filterFilesByType', () => {
    const mockFiles = [
      createMockFile('src/index.ts'),
      createMockFile('src/app.js'),
      createMockFile('package.json'),
      createMockFile('README.md'),
      createMockFile('src/utils.py')
    ];

    it('should filter files by type correctly', () => {
      const options: FileFilterOptions = {
        includeCodeFiles: true,
        includeConfigFiles: false,
        includeDependencyFiles: false,
        includeLockFiles: false,
        includeDocumentFiles: false,
        includeBinaryFiles: false,
        includeOtherFiles: false
      };

      const result = filterFilesByType(mockFiles, options);
      expect(result).toHaveLength(3);
      expect(result.every(f => f.relativePath.endsWith('.ts') || f.relativePath.endsWith('.js') || f.relativePath.endsWith('.py'))).toBe(true);
    });

    it('should filter by file size', () => {
      const largeFiles = [
        createMockFile('small.txt', 100),
        createMockFile('medium.txt', 1024),
        createMockFile('large.txt', 2048)
      ];

      const options: FileFilterOptions = {
        maxFileSize: 1024
      };

      const result = filterFilesByType(largeFiles, options);
      expect(result).toHaveLength(2);
      expect(result.every(f => f.size <= 1024)).toBe(true);
    });

    it('should exclude files by pattern', () => {
      const options: FileFilterOptions = {
        excludePatterns: ['node_modules', '.git']
      };

      const filesWithExcluded = [
        createMockFile('src/index.ts'),
        createMockFile('node_modules/lodash/index.js'),
        createMockFile('.git/config')
      ];

      const result = filterFilesByType(filesWithExcluded, options);
      expect(result).toHaveLength(1);
      expect(result[0].relativePath).toBe('src/index.ts');
    });

    it('should include all file types by default', () => {
      const result = filterFilesByType(mockFiles);
      expect(result).toHaveLength(mockFiles.length);
    });
  });

  describe('getFilesByPriority', () => {
    const mockFiles = [
      createMockFile('src/index.ts'), // high
      createMockFile('src/app.js'), // high
      createMockFile('src/utils.py'), // medium
      createMockFile('src/helper.rb'), // medium
      createMockFile('src/legacy.f90'), // low
      createMockFile('README.md') // low
    ];

    it('should get high priority files', () => {
      const result = getFilesByPriority(mockFiles, 'high');
      expect(result).toHaveLength(2);
      expect(result.every(f => f.relativePath.endsWith('.ts') || f.relativePath.endsWith('.js'))).toBe(true);
    });

    it('should get medium priority files', () => {
      const result = getFilesByPriority(mockFiles, 'medium');
      expect(result).toHaveLength(2);
      expect(result.every(f => f.relativePath.endsWith('.py') || f.relativePath.endsWith('.rb'))).toBe(true);
    });

    it('should get low priority files', () => {
      const result = getFilesByPriority(mockFiles, 'low');
      expect(result).toHaveLength(2);
      expect(result.every(f => f.relativePath.endsWith('.f90') || f.relativePath.endsWith('.md'))).toBe(true);
    });
  });

  describe('getCodeFiles', () => {
    const mockFiles = [
      createMockFile('src/index.ts'),
      createMockFile('src/app.js'),
      createMockFile('package.json'),
      createMockFile('README.md'),
      createMockFile('src/utils.py')
    ];

    it('should return only code files', () => {
      const result = getCodeFiles(mockFiles);
      expect(result).toHaveLength(3);
      expect(result.every(f => 
        f.relativePath.endsWith('.ts') || 
        f.relativePath.endsWith('.js') || 
        f.relativePath.endsWith('.py')
      )).toBe(true);
    });
  });

  describe('getDependencyFiles', () => {
    const mockFiles = [
      createMockFile('package.json'),
      createMockFile('pnpm-lock.yaml'),
      createMockFile('src/index.ts'),
      createMockFile('README.md')
    ];

    it('should return only dependency and lock files', () => {
      const result = getDependencyFiles(mockFiles);
      expect(result).toHaveLength(2);
      expect(result.every(f => 
        f.relativePath === 'package.json' || 
        f.relativePath === 'pnpm-lock.yaml'
      )).toBe(true);
    });
  });

  describe('isLargeFile', () => {
    it('should categorize file sizes correctly', () => {
      expect(isLargeFile(100)).toBe('small');
      expect(isLargeFile(1024 * 50)).toBe('small'); // 50KB < 100KB threshold
      expect(isLargeFile(1024 * 1024)).toBe('medium');
      expect(isLargeFile(1024 * 1024 * 5)).toBe('large'); // 5MB >= 5MB threshold
      expect(isLargeFile(1024 * 1024 * 15)).toBe('large'); // 15MB > 10MB threshold
    });

    it('should use custom thresholds', () => {
      const customThresholds = {
        small: 1024, // 1KB
        medium: 1024 * 1024, // 1MB
        large: 1024 * 1024 * 100 // 100MB
      };

      expect(isLargeFile(500, customThresholds)).toBe('small');
      expect(isLargeFile(1024 * 512, customThresholds)).toBe('medium');
      expect(isLargeFile(1024 * 1024 * 50, customThresholds)).toBe('large');
    });
  });

  describe('getFileStatistics', () => {
    const mockFiles = [
      createMockFile('src/index.ts', 1024),
      createMockFile('src/app.js', 2048),
      createMockFile('package.json', 512),
      createMockFile('src/utils.py', 1536),
      createMockFile('README.md', 256)
    ];

    it('should calculate correct statistics', () => {
      const stats = getFileStatistics(mockFiles);

      expect(stats.totalFiles).toBe(5);
      expect(stats.totalSize).toBe(5376); // 1024 + 2048 + 512 + 1536 + 256
      expect(stats.byCategory.code).toBe(3); // .ts, .js, .py
      expect(stats.byCategory.config).toBe(1); // package.json
      expect(stats.byCategory.document).toBe(1); // README.md
      expect(stats.byPriority.high).toBe(3); // .ts, .js, package.json (dependency file)
      expect(stats.byPriority.medium).toBe(1); // .py
      expect(stats.byPriority.low).toBe(1); // README.md
      expect(stats.dependencyFiles).toBe(1); // package.json
    });

    it('should handle empty file list', () => {
      const stats = getFileStatistics([]);

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.byCategory).toEqual({});
      expect(stats.byLanguage).toEqual({});
      expect(stats.byPriority).toEqual({ high: 0, medium: 0, low: 0 });
      expect(stats.largeFiles).toBe(0);
      expect(stats.dependencyFiles).toBe(0);
    });

    it('should count large files correctly', () => {
      const largeFiles = [
        createMockFile('small.txt', 100),
        createMockFile('medium.txt', 1024 * 1024),
        createMockFile('large.txt', 1024 * 1024 * 15)
      ];

      const stats = getFileStatistics(largeFiles);
      expect(stats.largeFiles).toBe(1); // Only 15MB file is considered large (1MB is medium)
    });
  });

  describe('FileTypeInfo interface', () => {
    it('should have correct structure', () => {
      const fileType: FileTypeInfo = {
        category: 'code',
        language: 'TypeScript',
        priority: 'high',
        isDependencyFile: false,
        isLockFile: false,
        isConfigFile: false
      };

      expect(fileType.category).toBe('code');
      expect(fileType.language).toBe('TypeScript');
      expect(fileType.priority).toBe('high');
      expect(fileType.isDependencyFile).toBe(false);
      expect(fileType.isLockFile).toBe(false);
      expect(fileType.isConfigFile).toBe(false);
    });
  });

  describe('FileFilterOptions interface', () => {
    it('should have correct structure', () => {
      const options: FileFilterOptions = {
        includeCodeFiles: true,
        includeConfigFiles: false,
        includeDependencyFiles: true,
        includeLockFiles: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: ['node_modules', '.git']
      };

      expect(options.includeCodeFiles).toBe(true);
      expect(options.includeConfigFiles).toBe(false);
      expect(options.includeDependencyFiles).toBe(true);
      expect(options.includeLockFiles).toBe(false);
      expect(options.maxFileSize).toBe(1024 * 1024);
      expect(options.excludePatterns).toEqual(['node_modules', '.git']);
    });
  });
});
