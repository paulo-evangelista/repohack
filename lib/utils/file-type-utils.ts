import { FileMetadata } from './file-utils';

export interface FileTypeInfo {
  category: 'code' | 'config' | 'binary' | 'document' | 'other';
  language?: string;
  priority: 'high' | 'medium' | 'low';
  isDependencyFile: boolean;
  isLockFile: boolean;
  isConfigFile: boolean;
}

export interface FileFilterOptions {
  includeCodeFiles?: boolean;
  includeConfigFiles?: boolean;
  includeDependencyFiles?: boolean;
  includeLockFiles?: boolean;
  includeDocumentFiles?: boolean;
  includeBinaryFiles?: boolean;
  includeOtherFiles?: boolean;
  maxFileSize?: number;
  excludePatterns?: string[];
}

// File extension mappings
const CODE_EXTENSIONS: Record<string, { language: string; priority: 'high' | 'medium' | 'low' }> = {
  // High priority - TypeScript and JavaScript
  'ts': { language: 'TypeScript', priority: 'high' },
  'tsx': { language: 'TypeScript React', priority: 'high' },
  'js': { language: 'JavaScript', priority: 'high' },
  'jsx': { language: 'JavaScript React', priority: 'high' },
  
  // Medium priority - Other code files
  'py': { language: 'Python', priority: 'medium' },
  'java': { language: 'Java', priority: 'medium' },
  'cpp': { language: 'C++', priority: 'medium' },
  'c': { language: 'C', priority: 'medium' },
  'go': { language: 'Go', priority: 'medium' },
  'rs': { language: 'Rust', priority: 'medium' },
  'php': { language: 'PHP', priority: 'medium' },
  'rb': { language: 'Ruby', priority: 'medium' },
  'swift': { language: 'Swift', priority: 'medium' },
  'kt': { language: 'Kotlin', priority: 'medium' },
  
  // Low priority - Other programming languages
  'scala': { language: 'Scala', priority: 'low' },
  'clj': { language: 'Clojure', priority: 'low' },
  'hs': { language: 'Haskell', priority: 'low' },
  'ml': { language: 'OCaml', priority: 'low' },
  'f90': { language: 'Fortran', priority: 'low' },
  'pas': { language: 'Pascal', priority: 'low' }
};

const CONFIG_EXTENSIONS: Record<string, string> = {
  'json': 'JSON',
  'yaml': 'YAML',
  'yml': 'YAML',
  'toml': 'TOML',
  'ini': 'INI',
  'cfg': 'Configuration',
  'conf': 'Configuration',
  'xml': 'XML',
  'properties': 'Properties'
};

const DOCUMENT_EXTENSIONS: Record<string, string> = {
  'md': 'Markdown',
  'txt': 'Text',
  'rst': 'reStructuredText',
  'adoc': 'AsciiDoc',
  'tex': 'LaTeX',
  'doc': 'Word Document',
  'docx': 'Word Document',
  'pdf': 'PDF'
};

// Dependency and lock file patterns
const DEPENDENCY_FILES = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'Cargo.toml',
  'Cargo.lock',
  'requirements.txt',
  'Pipfile',
  'Pipfile.lock',
  'Gemfile',
  'Gemfile.lock',
  'composer.json',
  'composer.lock',
  'pom.xml',
  'build.gradle',
  'build.sbt',
  'go.mod',
  'go.sum',
  'mix.exs',
  'mix.lock'
];

const LOCK_FILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'Cargo.lock',
  'Pipfile.lock',
  'Gemfile.lock',
  'composer.lock',
  'go.sum',
  'mix.lock'
];

/**
 * Identifies file type and provides categorization information
 */
export function identifyFileType(filePath: string): FileTypeInfo {
  const fileName = filePath.split('/').pop() || '';
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
  
  // Check if it's a lock file first (lock files take precedence)
  if (LOCK_FILES.includes(fileName)) {
    return {
      category: 'config',
      language: 'Lock File',
      priority: 'high',
      isDependencyFile: false,
      isLockFile: true,
      isConfigFile: true
    };
  }
  
  // Check if it's a dependency file
  if (DEPENDENCY_FILES.includes(fileName)) {
    return {
      category: 'config',
      language: 'Dependency Configuration',
      priority: 'high',
      isDependencyFile: true,
      isLockFile: false,
      isConfigFile: true
    };
  }
  
  // Check code files
  if (extension && CODE_EXTENSIONS[extension]) {
    const codeInfo = CODE_EXTENSIONS[extension];
    return {
      category: 'code',
      language: codeInfo.language,
      priority: codeInfo.priority,
      isDependencyFile: false,
      isLockFile: false,
      isConfigFile: false
    };
  }
  
  // Check config files
  if (extension && CONFIG_EXTENSIONS[extension]) {
    return {
      category: 'config',
      language: CONFIG_EXTENSIONS[extension],
      priority: 'medium',
      isDependencyFile: false,
      isLockFile: false,
      isConfigFile: true
    };
  }
  
  // Check document files
  if (extension && DOCUMENT_EXTENSIONS[extension]) {
    return {
      category: 'document',
      language: DOCUMENT_EXTENSIONS[extension],
      priority: 'low',
      isDependencyFile: false,
      isLockFile: false,
      isConfigFile: false
    };
  }
  
  // Default to other
  return {
    category: 'other',
    priority: 'low',
    isDependencyFile: false,
    isLockFile: false,
    isConfigFile: false
  };
}

/**
 * Filters files based on type and options
 */
export function filterFilesByType(
  files: FileMetadata[],
  options: FileFilterOptions = {}
): FileMetadata[] {
  const {
    includeCodeFiles = true,
    includeConfigFiles = true,
    includeDependencyFiles = true,
    includeLockFiles = true,
    includeDocumentFiles = true,
    includeBinaryFiles = true,
    includeOtherFiles = true,
    maxFileSize,
    excludePatterns = []
  } = options;
  
  return files.filter(file => {
    const fileType = identifyFileType(file.relativePath);
    
    // Apply specific file type filters first (these take precedence)
    if (fileType.isDependencyFile && !includeDependencyFiles) return false;
    if (fileType.isLockFile && !includeLockFiles) return false;
    
    // Apply category filters
    if (fileType.category === 'code' && !includeCodeFiles) return false;
    if (fileType.category === 'config' && !includeConfigFiles) return false;
    if (fileType.category === 'document' && !includeDocumentFiles) return false;
    if (fileType.category === 'binary' && !includeBinaryFiles) return false;
    if (fileType.category === 'other' && !includeOtherFiles) return false;
    
    // Apply size filter
    if (maxFileSize && file.size > maxFileSize) return false;
    
    // Apply exclude patterns
    if (excludePatterns.some(pattern => 
      file.relativePath.includes(pattern) || 
      new RegExp(pattern).test(file.relativePath)
    )) return false;
    
    return true;
  });
}

/**
 * Gets files by priority level
 */
export function getFilesByPriority(files: FileMetadata[], priority: 'high' | 'medium' | 'low'): FileMetadata[] {
  return files.filter(file => {
    const fileType = identifyFileType(file.relativePath);
    return fileType.priority === priority;
  });
}

/**
 * Gets all code files from a file list
 */
export function getCodeFiles(files: FileMetadata[]): FileMetadata[] {
  return files.filter(file => {
    const fileType = identifyFileType(file.relativePath);
    return fileType.category === 'code';
  });
}

/**
 * Gets all dependency-related files
 */
export function getDependencyFiles(files: FileMetadata[]): FileMetadata[] {
  return files.filter(file => {
    const fileType = identifyFileType(file.relativePath);
    return fileType.isDependencyFile || fileType.isLockFile;
  });
}

/**
 * Checks if a file is a large file based on size thresholds
 */
export function isLargeFile(fileSize: number, thresholds: { small: number; medium: number; large: number } = {
  small: 1024 * 100,      // 100KB
  medium: 1024 * 1024 * 5, // 5MB (increased to include 5MB files in medium range)
  large: 1024 * 1024 * 10 // 10MB
}): 'small' | 'medium' | 'large' {
  if (fileSize < thresholds.small) return 'small';
  if (fileSize < thresholds.medium) return 'medium';
  return 'large';
}

/**
 * Gets file statistics summary
 */
export function getFileStatistics(files: FileMetadata[]) {
  const stats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    byCategory: {} as Record<string, number>,
    byLanguage: {} as Record<string, number>,
    byPriority: { high: 0, medium: 0, low: 0 },
    largeFiles: 0,
    dependencyFiles: 0
  };
  
  files.forEach(file => {
    const fileType = identifyFileType(file.relativePath);
    
    // Count by category
    stats.byCategory[fileType.category] = (stats.byCategory[fileType.category] || 0) + 1;
    
    // Count by language
    if (fileType.language) {
      stats.byLanguage[fileType.language] = (stats.byLanguage[fileType.language] || 0) + 1;
    }
    
    // Count by priority
    stats.byPriority[fileType.priority]++;
    
    // Count large files
    if (isLargeFile(file.size) === 'large') {
      stats.largeFiles++;
    }
    
    // Count dependency files
    if (fileType.isDependencyFile || fileType.isLockFile) {
      stats.dependencyFiles++;
    }
  });
  
  return stats;
}
