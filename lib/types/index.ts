// Re-export repository types from git module
export type {
  RepositoryInfo,
  RepositoryMetadata,
  CloneOptions
} from '../git/repository';

export interface RepositoryFileMetadata {
  path: string;
  relativePath: string;
  size: number;
  modificationDate: Date;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  isFile: boolean;
  extension: string;
}

export interface RepositoryFile extends RepositoryFileMetadata {
  content: string;
}

export interface ASTNode {
  type: string;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  range?: [number, number];
  [key: string]: unknown;
}

export interface ParseResult {
  success: boolean;
  ast?: unknown;
  nodes?: ASTNode[];
  error?: string;
  filePath: string;
}

// Generic JSON structure types for dynamic rendering
export interface GenericField {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
}

export interface GenericThreat {
  [key: string]: unknown;
  // Common fields that might exist
  category?: string;
  subcategory?: string;
  severity?: string;
  description?: string;
  file?: string;
  line?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface GenericCategory {
  [key: string]: unknown;
  // Common fields that might exist
  name?: string;
  title?: string;
  label?: string;
  threats?: GenericThreat[];
  subcategories?: Record<string, GenericCategory>;
  count?: number;
}

export interface GenericScanResult {
  repository?: {
    path?: string;
    metadata?: {
      name?: string;
      owner?: string;
      url?: string;
      size?: number;
      fileCount?: number;
      commitHash?: string;
      branch?: string;
      cloneTime?: Date;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  scanCompleted?: boolean;
  errors?: string[];
  threats?: GenericThreat[];
  categories?: Record<string, GenericCategory>;
  overallStatus?: string;
  scanTime?: number;
  scannedFiles?: number;
  [key: string]: unknown;
}

// Legacy threat detection types (for backward compatibility)
export interface ThreatResult {
  category: string;
  subcategory: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  file: string;
  line?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ScanResult {
  repository: {
    path: string;
    metadata: {
      name: string;
      owner: string;
      url: string;
      size: number;
      fileCount: number;
      commitHash: string;
      branch: string;
      cloneTime: Date;
    };
  };
  scanCompleted: boolean;
  errors: string[];
  threats?: ThreatResult[];
  overallStatus: 'SAFE' | 'UNSAFE' | 'WARNING';
  scanTime: number;
  scannedFiles: number;
}

export interface ThreatScanner {
  name: string;
  category: string;
  subcategory: string;
  scan(files: RepositoryFile[]): Promise<ThreatResult[]>;
}
