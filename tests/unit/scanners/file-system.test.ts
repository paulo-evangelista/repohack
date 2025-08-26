import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  scanFileSystem, 
  getFileSystemScanSummary,
  FileSystemThreat,
  FileSystemScanResult,
  FileSystemScanOptions,
  ThreatDetectionRule
} from '../../../lib/scanners/file-system';
import { FileMetadata } from '../../../lib/utils/file-utils';

// Mock the utility modules
vi.mock('../../../lib/utils/file-utils', async () => {
  const actual = await vi.importActual('../../../lib/utils/file-utils');
  return {
    ...actual,
    traverseDirectory: vi.fn()
  };
});

vi.mock('../../../lib/utils/file-type-utils', async () => {
  const actual = await vi.importActual('../../../lib/utils/file-type-utils');
  return {
    ...actual,
    filterFilesByType: vi.fn(),
    getFileStatistics: vi.fn()
  };
});

vi.mock('../../../lib/utils/file-processing', async () => {
  const actual = await vi.importActual('../../../lib/utils/file-processing');
  return {
    ...actual,
    readFileWithMemoryMonitoring: vi.fn(),
    MemoryMonitor: vi.fn()
  };
});

const mockTraverseDirectory = vi.mocked(await import('../../../lib/utils/file-utils')).traverseDirectory;
const mockFilterFilesByType = vi.mocked(await import('../../../lib/utils/file-type-utils')).filterFilesByType;
const mockGetFileStatistics = vi.mocked(await import('../../../lib/utils/file-type-utils')).getFileStatistics;
const mockReadFileWithMemoryMonitoring = vi.mocked(await import('../../../lib/utils/file-processing')).readFileWithMemoryMonitoring;
const MockMemoryMonitor = vi.mocked(await import('../../../lib/utils/file-processing')).MemoryMonitor as any;

describe('File System Scanner', () => {
  const mockRepositoryPath = '/test/repo';
  const mockFileMetadata: FileMetadata = {
    path: '/test/repo/README.md',
    relativePath: 'README.md',
    size: 1024,
    modificationDate: new Date(),
    isDirectory: false,
    isSymbolicLink: false,
    isFile: true
  };

  const mockTraversalResult = {
    files: [mockFileMetadata],
    directories: [],
    errors: [],
    totalSize: 1024
  };

  const mockFileStatistics = {
    totalFiles: 1,
    totalSize: 1024,
    byCategory: { document: 1 },
    byLanguage: { Markdown: 1 },
    byPriority: { high: 0, medium: 0, low: 1 },
    largeFiles: 0,
    dependencyFiles: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockTraverseDirectory.mockResolvedValue(mockTraversalResult);
    mockFilterFilesByType.mockReturnValue([mockFileMetadata]);
    mockGetFileStatistics.mockReturnValue(mockFileStatistics);
    
    // Mock MemoryMonitor
    MockMemoryMonitor.mockImplementation(() => ({
      checkpoint: vi.fn().mockReturnValue({ used: 50 * 1024 * 1024 }),
      getReport: vi.fn().mockReturnValue({
        start: { used: 50 * 1024 * 1024 },
        current: { used: 50 * 1024 * 1024 },
        peak: { used: 50 * 1024 * 1024 },
        checkpoints: [],
        isOverLimit: false
      }),
      isOverLimit: vi.fn().mockReturnValue(false)
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('scanFileSystem', () => {
    it('should scan file system successfully', async () => {
      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.threats).toHaveLength(0);
      expect(result.files).toHaveLength(1);
      expect(result.statistics).toEqual(mockFileStatistics);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.errors).toHaveLength(0);
      expect(mockTraverseDirectory).toHaveBeenCalledWith(mockRepositoryPath, {
        maxDepth: 10,
        includeHidden: false,
        fileExtensions: [],
        maxFileSize: undefined,
        followSymlinks: false
      });
    });

    it('should use custom scan options', async () => {
      const options: FileSystemScanOptions = {
        maxDepth: 5,
        includeHidden: true,
        fileExtensions: ['ts', 'js'],
        maxFileSize: 1024 * 1024,
        followSymlinks: true,
        memoryLimit: 100 * 1024 * 1024
      };

      await scanFileSystem(mockRepositoryPath, options);

      expect(mockTraverseDirectory).toHaveBeenCalledWith(mockRepositoryPath, {
        maxDepth: 5,
        includeHidden: true,
        fileExtensions: ['ts', 'js'],
        maxFileSize: 1024 * 1024,
        followSymlinks: true
      });
    });

    it('should handle traversal errors', async () => {
      const traversalResultWithErrors = {
        ...mockTraversalResult,
        errors: ['Permission denied for .git directory']
      };
      mockTraverseDirectory.mockResolvedValue(traversalResultWithErrors);

      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.errors).toContain('Permission denied for .git directory');
    });

    it('should handle scan failures gracefully', async () => {
      mockTraverseDirectory.mockRejectedValue(new Error('Scan failed'));

      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.errors).toContain('File system scan failed: Error: Scan failed');
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should track memory usage throughout scan', async () => {
      const mockCheckpoint = vi.fn()
        .mockReturnValueOnce({ used: 50 * 1024 * 1024 }) // start
        .mockReturnValueOnce({ used: 75 * 1024 * 1024 }) // after-traversal
        .mockReturnValueOnce({ used: 80 * 1024 * 1024 }) // after-threat-analysis
        .mockReturnValueOnce({ used: 85 * 1024 * 1024 }); // scan-end

      const mockGetReport = vi.fn().mockReturnValue({
        start: { used: 50 * 1024 * 1024 },
        current: { used: 85 * 1024 * 1024 },
        peak: { used: 90 * 1024 * 1024 },
        checkpoints: [],
        isOverLimit: false
      });

      MockMemoryMonitor.mockImplementation(() => ({
        checkpoint: mockCheckpoint,
        getReport: mockGetReport,
        isOverLimit: vi.fn().mockReturnValue(false)
      }));

      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.memoryUsage.start).toBe(50 * 1024 * 1024);
      expect(result.memoryUsage.peak).toBe(90 * 1024 * 1024);
      expect(result.memoryUsage.end).toBe(85 * 1024 * 1024);
    });
  });

  describe('threat detection', () => {
    it('should detect threats based on default rules', async () => {
      const suspiciousFile = {
        ...mockFileMetadata,
        relativePath: 'src/script.js'
      };

      mockFilterFilesByType.mockReturnValue([suspiciousFile]);

      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.threats).toHaveLength(2);
      expect(result.threats[0].type).toBe('file-system');
      expect(result.threats[0].severity).toBe('medium');
      expect(result.threats[0].description).toBe('Executable or script file detected');
      expect(result.threats[0].filePath).toBe('src/script.js');
    });

    it('should detect hidden files', async () => {
      const hiddenFile = {
        ...mockFileMetadata,
        relativePath: '.env'
      };

      mockFilterFilesByType.mockReturnValue([hiddenFile]);

      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.threats).toHaveLength(1);
      expect(result.threats[0].description).toBe('Hidden file detected');
      expect(result.threats[0].severity).toBe('low');
    });

    it('should detect large files', async () => {
      const largeFile = {
        ...mockFileMetadata,
        size: 15 * 1024 * 1024 // 15MB
      };

      mockFilterFilesByType.mockReturnValue([largeFile]);

      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.threats).toHaveLength(1);
      expect(result.threats[0].description).toBe('Large file detected');
      expect(result.threats[0].severity).toBe('medium');
      expect(result.threats[0].details.category).toBe('performance');
    });

    it('should use custom threat detection rules', async () => {
      const customRules: ThreatDetectionRule[] = [
        {
          name: 'Custom Rule',
          pattern: /\.custom$/,
          severity: 'critical',
          description: 'Custom file type detected',
          category: 'security'
        }
      ];

      const customFile = {
        ...mockFileMetadata,
        relativePath: 'config.custom'
      };

      mockFilterFilesByType.mockReturnValue([customFile]);

      const options: FileSystemScanOptions = {
        threatDetectionRules: customRules
      };

      const result = await scanFileSystem(mockRepositoryPath, options);

      expect(result.threats).toHaveLength(1);
      expect(result.threats[0].description).toBe('Custom file type detected');
      expect(result.threats[0].severity).toBe('critical');
      expect(result.threats[0].details.rule).toBe('Custom Rule');
    });
  });

  describe('dependency file analysis', () => {
    it('should analyze package.json for suspicious patterns', async () => {
      const packageJson = {
        ...mockFileMetadata,
        relativePath: 'package.json'
      };

      mockFilterFilesByType.mockReturnValue([packageJson]);
      mockReadFileWithMemoryMonitoring.mockResolvedValue({
        content: '{"scripts": {"build": "eval(process.env.BUILD_SCRIPT)"}}',
        metadata: packageJson,
        memoryUsage: { used: 50 * 1024 * 1024, total: 100 * 1024 * 1024, percentage: 50, isOverLimit: false },
        processingTime: 100,
        chunks: 1
      });

      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.threats).toHaveLength(1);
      expect(result.threats[0].description).toBe('eval() function usage detected');
      expect(result.threats[0].severity).toBe('high');
      expect(result.threats[0].details.category).toBe('security');
    });

    it('should handle dependency file read errors gracefully', async () => {
      const packageJson = {
        ...mockFileMetadata,
        relativePath: 'package.json'
      };

      mockFilterFilesByType.mockReturnValue([packageJson]);
      mockReadFileWithMemoryMonitoring.mockRejectedValue(new Error('File read failed'));

      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.errors).toContain('Failed to analyze dependency file package.json: Error: File read failed');
    });
  });

  describe('memory monitoring', () => {
    it('should stop processing when memory limit is exceeded', async () => {
      MockMemoryMonitor.mockImplementation(() => ({
        checkpoint: vi.fn().mockReturnValue({ used: 50 * 1024 * 1024 }),
        getReport: vi.fn().mockReturnValue({
          start: { used: 50 * 1024 * 1024 },
          current: { used: 50 * 1024 * 1024 },
          peak: { used: 50 * 1024 * 1024 },
          checkpoints: [],
          isOverLimit: false
        }),
        isOverLimit: vi.fn().mockReturnValue(true)
      }));

      const result = await scanFileSystem(mockRepositoryPath);

      expect(result.errors).toContain('Memory limit exceeded while analyzing README.md');
    });
  });

  describe('getFileSystemScanSummary', () => {
    it('should generate correct summary', () => {
      const mockResult: FileSystemScanResult = {
        threats: [
          {
            type: 'file-system',
            severity: 'high',
            filePath: 'src/script.js',
            description: 'Script file detected',
            details: {},
            timestamp: new Date()
          },
          {
            type: 'file-system',
            severity: 'medium',
            filePath: 'large.bin',
            description: 'Large file detected',
            details: {},
            timestamp: new Date()
          }
        ],
        files: [mockFileMetadata],
        statistics: mockFileStatistics,
        processingTime: 1500,
        memoryUsage: {
          start: 50 * 1024 * 1024,
          peak: 75 * 1024 * 1024,
          end: 60 * 1024 * 1024
        },
        errors: []
      };

      const summary = getFileSystemScanSummary(mockResult);

      expect(summary.totalFiles).toBe(1);
      expect(summary.totalThreats).toBe(2);
      expect(summary.threatsBySeverity.high).toBe(1);
      expect(summary.threatsBySeverity.medium).toBe(1);
      expect(summary.processingTime).toBe('1500ms');
      expect(summary.memoryUsage).toBe('75MB');
      expect(summary.errors).toBe(0);
    });

    it('should handle empty results', () => {
      const emptyResult: FileSystemScanResult = {
        threats: [],
        files: [],
        statistics: {
          totalFiles: 0,
          totalSize: 0,
          byCategory: {},
          byLanguage: {},
          byPriority: { high: 0, medium: 0, low: 0 },
          largeFiles: 0,
          dependencyFiles: 0
        },
        processingTime: 0,
        memoryUsage: { start: 0, peak: 0, end: 0 },
        errors: []
      };

      const summary = getFileSystemScanSummary(emptyResult);

      expect(summary.totalFiles).toBe(0);
      expect(summary.totalThreats).toBe(0);
      expect(summary.threatsBySeverity).toEqual({});
      expect(summary.processingTime).toBe('0ms');
      expect(summary.memoryUsage).toBe('0MB');
    });
  });

  describe('interfaces', () => {
    it('should have correct FileSystemThreat structure', () => {
      const threat: FileSystemThreat = {
        type: 'file-system',
        severity: 'high',
        filePath: 'src/script.js',
        description: 'Script file detected',
        details: {
          rule: 'Suspicious File Extension',
          category: 'security',
          fileSize: 1024
        },
        timestamp: new Date()
      };

      expect(threat.type).toBe('file-system');
      expect(threat.severity).toBe('high');
      expect(threat.filePath).toBe('src/script.js');
      expect(threat.description).toBe('Script file detected');
      expect(threat.details.rule).toBe('Suspicious File Extension');
    });

    it('should have correct ThreatDetectionRule structure', () => {
      const rule: ThreatDetectionRule = {
        name: 'Test Rule',
        pattern: /\.test$/,
        severity: 'medium',
        description: 'Test file detected',
        category: 'quality'
      };

      expect(rule.name).toBe('Test Rule');
      expect(rule.pattern).toEqual(/\.test$/);
      expect(rule.severity).toBe('medium');
      expect(rule.description).toBe('Test file detected');
      expect(rule.category).toBe('quality');
    });

    it('should have correct FileSystemScanOptions structure', () => {
      const options: FileSystemScanOptions = {
        maxDepth: 5,
        includeHidden: true,
        fileExtensions: ['ts', 'js'],
        maxFileSize: 1024 * 1024,
        followSymlinks: true,
        threatDetectionRules: [],
        memoryLimit: 100 * 1024 * 1024,
        processingTimeout: 30000
      };

      expect(options.maxDepth).toBe(5);
      expect(options.includeHidden).toBe(true);
      expect(options.fileExtensions).toEqual(['ts', 'js']);
      expect(options.maxFileSize).toBe(1024 * 1024);
      expect(options.followSymlinks).toBe(true);
      expect(options.memoryLimit).toBe(100 * 1024 * 1024);
      expect(options.processingTimeout).toBe(30000);
    });
  });
});
