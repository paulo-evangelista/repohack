import { TraversalOptions, traverseDirectory } from '../utils/file-utils';
import { 
  identifyFileType, 
  filterFilesByType, 
  getFileStatistics 
} from '../utils/file-type-utils';
import { 
  readFileWithMemoryMonitoring, 
  MemoryMonitor
} from '../utils/file-processing';
import { RepositoryFileMetadata } from '../types';

export interface FileSystemThreat {
  type: 'file-system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  filePath: string;
  description: string;
  details: Record<string, string | number | boolean | Date>;
  timestamp: Date;
}

export interface FileSystemScanResult {
  threats: FileSystemThreat[];
  files: RepositoryFileMetadata[];
  statistics: ReturnType<typeof getFileStatistics>;
  processingTime: number;
  memoryUsage: {
    start: number;
    peak: number;
    end: number;
  };
  errors: string[];
}

export interface FileSystemScanOptions extends TraversalOptions {
  threatDetectionRules?: ThreatDetectionRule[];
  memoryLimit?: number;
  processingTimeout?: number;
}

export interface ThreatDetectionRule {
  name: string;
  pattern: RegExp | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  category: 'security' | 'performance' | 'quality' | 'compliance';
}

/**
 * Default threat detection rules for file system scanning
 */
const DEFAULT_THREAT_RULES: ThreatDetectionRule[] = [
  // Security threats
  {
    name: 'Suspicious File Extension',
    pattern: /\.(exe|bat|cmd|ps1|sh|py|rb|php|js|vbs)$/i,
    severity: 'medium',
    description: 'Executable or script file detected',
    category: 'security'
  },
  {
    name: 'Hidden File',
    pattern: /^\.[^\/]+$/,
    severity: 'low',
    description: 'Hidden file detected',
    category: 'security'
  },
  {
    name: 'Large Binary File',
    pattern: /\.(bin|dat|img|iso|tar|gz|zip|rar|7z)$/i,
    severity: 'low',
    description: 'Large binary file detected',
    category: 'performance'
  },
  {
    name: 'Configuration File',
    pattern: /\.(conf|config|ini|cfg|properties)$/i,
    severity: 'low',
    description: 'Configuration file detected',
    category: 'compliance'
  },
  {
    name: 'Lock File',
    pattern: /\.(lock|lockfile)$/i,
    severity: 'low',
    description: 'Lock file detected',
    category: 'quality'
  }
];

/**
 * Scans file system for potential threats and security issues
 */
export async function scanFileSystem(
  repositoryPath: string,
  options: FileSystemScanOptions = {}
): Promise<FileSystemScanResult> {
  const startTime = Date.now();
  const memoryMonitor = new MemoryMonitor(options.memoryLimit || 200 * 1024 * 1024); // 200MB default
  
  const result: FileSystemScanResult = {
    threats: [],
    files: [],
    statistics: { totalFiles: 0, totalSize: 0, byCategory: {}, byLanguage: {}, byPriority: { high: 0, medium: 0, low: 0 }, largeFiles: 0, dependencyFiles: 0 },
    processingTime: 0,
    memoryUsage: { start: 0, peak: 0, end: 0 },
    errors: []
  };

  try {
    // Checkpoint memory usage
    const startMemory = memoryMonitor.checkpoint('scan-start');
    result.memoryUsage.start = startMemory.used;

    // Traverse directory structure
    const traversalResult = await traverseDirectory(repositoryPath, {
      maxDepth: options.maxDepth || 10,
      includeHidden: options.includeHidden || false,
      fileExtensions: options.fileExtensions || [],
      maxFileSize: options.maxFileSize,
      followSymlinks: options.followSymlinks || false
    });

    // Add traversal errors
    result.errors.push(...traversalResult.errors);

    // Filter files based on type
    const filteredFiles = filterFilesByType(traversalResult.files, {
      includeCodeFiles: true,
      includeConfigFiles: true,
      includeDependencyFiles: true,
      includeLockFiles: true,
      maxFileSize: options.maxFileSize
    });

    result.files = filteredFiles;

    // Get file statistics
    result.statistics = getFileStatistics(filteredFiles);

    // Checkpoint memory after traversal
    memoryMonitor.checkpoint('after-traversal');

    // Analyze files for threats
    const threatRules = options.threatDetectionRules || DEFAULT_THREAT_RULES;
    await analyzeFilesForThreats(filteredFiles, threatRules, result, memoryMonitor);

    // Checkpoint memory after threat analysis
    memoryMonitor.checkpoint('after-threat-analysis');

    // Final memory usage
    const endMemory = memoryMonitor.checkpoint('scan-end');
    const memoryReport = memoryMonitor.getReport();
    
    result.memoryUsage = {
      start: startMemory.used,
      peak: memoryReport.peak.used,
      end: endMemory.used
    };

    result.processingTime = Date.now() - startTime;

    return result;

  } catch (error) {
    result.errors.push(`File system scan failed: ${error}`);
    result.processingTime = Date.now() - startTime;
    
    const endMemory = memoryMonitor.checkpoint('error-end');
    result.memoryUsage = {
      start: result.memoryUsage.start,
      peak: memoryMonitor.getReport().peak.used,
      end: endMemory.used
    };

    return result;
  }
}

/**
 * Analyzes files for potential threats based on detection rules
 */
async function analyzeFilesForThreats(
  files: RepositoryFileMetadata[],
  rules: ThreatDetectionRule[],
  result: FileSystemScanResult,
  memoryMonitor: MemoryMonitor
): Promise<void> {
  for (const file of files) {
    try {
      // Check memory usage
      if (memoryMonitor.isOverLimit()) {
        result.errors.push(`Memory limit exceeded while analyzing ${file.relativePath}`);
        continue;
      }

      // Apply threat detection rules
      for (const rule of rules) {
        const isMatch = typeof rule.pattern === 'string' 
          ? file.relativePath.includes(rule.pattern)
          : rule.pattern.test(file.relativePath);

        if (isMatch) {
          const threat: FileSystemThreat = {
            type: 'file-system',
            severity: rule.severity,
            filePath: file.relativePath,
            description: rule.description,
            details: {
              rule: rule.name,
              category: rule.category,
              fileSize: file.size,
              modificationDate: file.modificationDate,
              isDirectory: file.isDirectory,
              isSymbolicLink: file.isSymbolicLink
            },
            timestamp: new Date()
          };

          result.threats.push(threat);
        }
      }

      // Additional analysis for specific file types
      await analyzeSpecificFileTypes(file, result, memoryMonitor);

    } catch (error) {
      result.errors.push(`Failed to analyze file ${file.relativePath}: ${error}`);
    }
  }
}

/**
 * Performs specific analysis for different file types
 */
async function analyzeSpecificFileTypes(
  file: RepositoryFileMetadata,
  result: FileSystemScanResult,
  memoryMonitor: MemoryMonitor
): Promise<void> {
  const fileType = identifyFileType(file.relativePath);

  // Analyze dependency files
  if (fileType.isDependencyFile || fileType.isLockFile) {
    await analyzeDependencyFile(file, result, memoryMonitor);
  }

  // Analyze large files
  if (file.size > 10 * 1024 * 1024) { // 10MB
    const threat: FileSystemThreat = {
      type: 'file-system',
      severity: 'medium',
      filePath: file.relativePath,
      description: 'Large file detected',
      details: {
        fileSize: file.size,
        category: 'performance',
        fileType: fileType.category,
        language: fileType.language || 'unknown'
      },
      timestamp: new Date()
    };
    result.threats.push(threat);
  }

  // Analyze executable files
  if (fileType.category === 'code' && fileType.language?.includes('Script')) {
    const threat: FileSystemThreat = {
      type: 'file-system',
      severity: 'high',
      filePath: file.relativePath,
      description: 'Script file detected',
      details: {
        language: fileType.language || 'unknown',
        category: 'security',
        fileSize: file.size
      },
      timestamp: new Date()
    };
    result.threats.push(threat);
  }
}

/**
 * Analyzes dependency files for potential security issues
 */
async function analyzeDependencyFile(
  file: RepositoryFileMetadata,
  result: FileSystemScanResult,
  memoryMonitor: MemoryMonitor
): Promise<void> {
  try {
    // Check memory usage
    if (memoryMonitor.isOverLimit()) {
      return;
    }

    // Read file content for analysis
    const processingResult = await readFileWithMemoryMonitoring(file.path, {
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB limit for dependency files
      encoding: 'utf-8'
    });

    const content = processingResult.content as string;

    // Check for suspicious patterns in dependency files
    const suspiciousPatterns = [
      { pattern: /eval\s*\(/, description: 'eval() function usage detected' },
      { pattern: /exec\s*\(/, description: 'exec() function usage detected' },
      { pattern: /system\s*\(/, description: 'system() function usage detected' },
      { pattern: /require\s*\(/, description: 'Dynamic require detected' },
      { pattern: /import\s*\(/, description: 'Dynamic import detected' }
    ];

    for (const { pattern, description } of suspiciousPatterns) {
      if (pattern.test(content)) {
        const threat: FileSystemThreat = {
          type: 'file-system',
          severity: 'high',
          filePath: file.relativePath,
          description: description,
          details: {
            category: 'security',
            fileType: 'dependency',
            pattern: pattern.source,
            fileSize: file.size
          },
          timestamp: new Date()
        };
        result.threats.push(threat);
      }
    }

  } catch (error) {
    result.errors.push(`Failed to analyze dependency file ${file.relativePath}: ${error}`);
  }
}

/**
 * Gets a summary of file system scan results
 */
export function getFileSystemScanSummary(result: FileSystemScanResult): {
  totalFiles: number;
  totalThreats: number;
  threatsBySeverity: Record<string, number>;
  processingTime: string;
  memoryUsage: string;
  errors: number;
} {
  const threatsBySeverity = result.threats.reduce((acc, threat) => {
    acc[threat.severity] = (acc[threat.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalFiles: result.files.length,
    totalThreats: result.threats.length,
    threatsBySeverity,
    processingTime: `${result.processingTime}ms`,
    memoryUsage: `${Math.round(result.memoryUsage.peak / 1024 / 1024)}MB`,
    errors: result.errors.length
  };
}
