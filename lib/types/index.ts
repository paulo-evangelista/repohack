// Re-export repository types from git module
export type {
  RepositoryInfo,
  RepositoryMetadata,
  CloneOptions
} from '../git/repository';

// AST and file processing types
export interface RepositoryFile {
  path: string;
  content: string;
  size: number;
  extension: string;
  lastModified?: Date;
  isBinary: boolean;
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

// Threat detection types
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

export interface ThreatScanner {
  name: string;
  category: string;
  subcategory: string;
  scan(files: RepositoryFile[]): Promise<ThreatResult[]>;
}
