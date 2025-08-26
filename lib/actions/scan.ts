import { cloneRepository, RepositoryInfo } from '../git/repository';

export interface ScanOptions {
  timeout?: number;
  depth?: number;
  branch?: string;
}

export interface ScanResult {
  repository: RepositoryInfo;
  scanCompleted: boolean;
  errors: string[];
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
  const errors: string[] = [];
  
  try {
    // Clone the repository
    const repository = await cloneRepository(repositoryUrl, {
      timeout: options.timeout,
      depth: options.depth,
      branch: options.branch
    });
    
    return {
      repository,
      scanCompleted: true,
      errors: []
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
          cloneTime: new Date()
        },
        cleanup: async () => {}
      },
      scanCompleted: false,
      errors
    };
  }
}
