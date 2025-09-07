'use server';

import { readFile } from 'fs/promises';
import { cloneRepository } from '../git/repository';
import { scanFileSystem } from '../scanners/file-system';
import { ThreatResult, RepositoryFile } from '../types';
import { parseAST } from '../utils/ast-parser';
import { CodeExecutionScanner } from '../scanners/code-execution';

export interface ScanOptions {
  timeout?: number;
  depth?: number;
  branch?: string;
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

/**
 * Main scan function that clones a repository and prepares it for scanning
 * @param repositoryUrl - The URL of the repository to scan
 * @param options - Optional scanning parameters
 * @returns Promise<ScanResult> with repository info and scan status
 */
export async function scanRepository(
  repositoryUrl: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Clone the repository
    const repository = await cloneRepository(repositoryUrl, {
      timeout: options.timeout,
      depth: options.depth,
      branch: options.branch,
    });

    const scanResult = await scanFileSystem(repository.path, {
      maxFileSize: 1024 * 1024 * 1024,
      fileExtensions: ['ts', 'js', 'jsx', 'tsx'],
    });

    // Convert FileMetadata to RepositoryFile format for scanners
    const threats: ThreatResult[] = [];
    const files: RepositoryFile[] = [];

    for (const file of scanResult.files) {
      if (!file.isFile) continue;
      if (file.path.includes('.git')) continue;
      console.log("Reading file", file.path);
      const content = await readFile(file.path, 'utf8');
      const repositoryFile: RepositoryFile = { ...file, content };
      files.push(repositoryFile);
    }

    const codeExecutionScanner = new CodeExecutionScanner();
    const codeExecutionThreats = await codeExecutionScanner.scan(files);
    threats.push(...codeExecutionThreats);
    console.log("errors", errors);
    const scanTime = Date.now() - startTime;
    const scannedFiles = files.length;
    return {
      repository: {
        path: repository.path,
        metadata: repository.metadata,
      },
      scanCompleted: true,
      errors,
      threats,
      overallStatus: threats.length > 0 ? 'UNSAFE' : 'SAFE',
      scanTime,
      scannedFiles,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    errors.push(errorMessage);

    // Return a failed result
    return {
      repository: {
        path: '',
        metadata: {
          name: 'unknown',
          owner: 'unknown',
          url: repositoryUrl,
          size: 0,
          fileCount: 0,
          commitHash: 'unknown',
          branch: 'unknown',
          cloneTime: new Date(),
        },
      },
      scanCompleted: false,
      errors,
      threats: [],
      overallStatus: 'UNSAFE',
      scanTime: Date.now() - startTime,
      scannedFiles: 0,
    };
  }
}
