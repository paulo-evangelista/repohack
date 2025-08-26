import { simpleGit, SimpleGit } from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface RepositoryInfo {
  path: string;
  metadata: RepositoryMetadata;
  cleanup: () => Promise<void>;
}

export interface RepositoryMetadata {
  name: string;
  owner: string;
  url: string;
  size: number;
  fileCount: number;
  commitHash: string;
  branch: string;
  cloneTime: Date;
}

export interface CloneOptions {
  timeout?: number;
  depth?: number;
  branch?: string;
}

/**
 * Clones a Git repository to a temporary directory
 * @param repositoryUrl - The URL of the repository to clone
 * @param options - Optional cloning parameters
 * @returns Promise<RepositoryInfo> with repository path, metadata, and cleanup function
 */
export async function cloneRepository(
  repositoryUrl: string,
  options: CloneOptions = {}
): Promise<RepositoryInfo> {
  const {
    timeout = 300000, // 5 minutes default
    depth = 1, // Shallow clone by default
    branch = 'main'
  } = options;

  // Validate repository URL
  if (!isValidRepositoryUrl(repositoryUrl)) {
    throw new Error('Invalid repository URL provided');
  }

  // Create temporary directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-clone-'));
  
  try {
    // Initialize git in temporary directory
    const git: SimpleGit = simpleGit(tempDir);
    
    // Set timeout for git operations
    git.timeout(timeout);
    
    // Clone repository
    await git.clone(repositoryUrl, tempDir, {
      '--depth': depth.toString(),
      '--branch': branch,
      '--single-branch': true
    });
    
    // Extract metadata
    const metadata = await extractRepositoryMetadata(git, repositoryUrl, tempDir);
    
    // Create cleanup function
    const cleanup = async (): Promise<void> => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Failed to cleanup temporary directory:', error);
      }
    };
    
    return {
      path: tempDir,
      metadata,
      cleanup
    };
    
  } catch (error) {
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Failed to cleanup temporary directory after error:', cleanupError);
    }
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      if (error.message.includes('Authentication failed')) {
        throw new Error('Repository is private or requires authentication');
      } else if (error.message.includes('Repository not found')) {
        throw new Error('Repository not found or access denied');
      } else if (error.message.includes('timeout')) {
        throw new Error('Repository cloning timed out');
      }
    }
    
    throw new Error('Failed to clone repository. Please check the URL and try again.');
  }
}

/**
 * Validates if the provided URL is a valid Git repository URL
 */
function isValidRepositoryUrl(url: string): boolean {
  // Handle SSH URLs like git@github.com:owner/repo.git
  // Must start with 'git@' and contain a colon after the hostname
  if (url.startsWith('git@') && url.includes(':')) {
    const parts = url.split('@');
    if (parts.length === 2) {
      const hostPart = parts[1].split(':')[0];
      return hostPart.length > 0;
    }
  }
  
  try {
    const urlObj = new URL(url);
    // Only allow http, https, git, and ssh protocols
    if (!['http:', 'https:', 'git:', 'ssh:'].includes(urlObj.protocol)) {
      return false;
    }
    // Reject mailto, ftp, and other non-git protocols
    if (['mailto:', 'ftp:', 'file:'].includes(urlObj.protocol)) {
      return false;
    }
    return urlObj.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Extracts metadata from the cloned repository
 */
async function extractRepositoryMetadata(
  git: SimpleGit,
  repositoryUrl: string,
  repositoryPath: string
): Promise<RepositoryMetadata> {
  try {
    // Get current commit hash
    const commitHash = await git.revparse(['HEAD']);
    
    // Get current branch
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    
    // Parse repository name and owner from URL
    const { name, owner } = parseRepositoryFromUrl(repositoryUrl);
    
    // Calculate repository size and file count
    const { size, fileCount } = await calculateRepositoryStats(repositoryPath);
    
    return {
      name,
      owner,
      url: repositoryUrl,
      size,
      fileCount,
      commitHash,
      branch,
      cloneTime: new Date()
    };
  } catch {
    // Provide default values if metadata extraction fails
    const { name, owner } = parseRepositoryFromUrl(repositoryUrl);
    return {
      name,
      owner,
      url: repositoryUrl,
      size: 0,
      fileCount: 0,
      commitHash: 'unknown',
      branch: 'unknown',
      cloneTime: new Date()
    };
  }
}

/**
 * Parses repository name and owner from URL
 */
function parseRepositoryFromUrl(url: string): { name: string; owner: string } {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        name: pathParts[1].replace(/\.git$/, '')
      };
    }
    
    return { owner: 'unknown', name: 'unknown' };
  } catch {
    return { owner: 'unknown', name: 'unknown' };
  }
}

/**
 * Calculates repository size and file count
 */
async function calculateRepositoryStats(repositoryPath: string): Promise<{ size: number; fileCount: number }> {
  let totalSize = 0;
  let fileCount = 0;
  
  async function calculateDirectoryStats(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip .git directory
        if (entry.name === '.git') continue;
        
        if (entry.isDirectory()) {
          await calculateDirectoryStats(fullPath);
        } else if (entry.isFile()) {
          try {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
            fileCount++;
          } catch {
            // Skip files that can't be stat'd
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }
  
  await calculateDirectoryStats(repositoryPath);
  
  return { size: totalSize, fileCount };
}
