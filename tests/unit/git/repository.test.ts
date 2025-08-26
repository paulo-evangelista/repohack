import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';

// Mock simple-git
vi.mock('simple-git', () => ({
  simpleGit: vi.fn()
}));

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    mkdtemp: vi.fn(),
    rm: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn()
  }
}));

// Mock os module
vi.mock('os', () => ({
  default: {
    tmpdir: vi.fn(() => '/tmp')
  },
  tmpdir: vi.fn(() => '/tmp')
}));

interface MockGit {
  timeout: ReturnType<typeof vi.fn>;
  clone: ReturnType<typeof vi.fn>;
  revparse: ReturnType<typeof vi.fn>;
}

interface MockSimpleGit {
  mockReturnValue: (mock: MockGit) => void;
}

describe('Repository Module', () => {
  let mockGit: MockGit;
  let mockTempDir: string;
  let mockSimpleGit: MockSimpleGit;
  
  beforeEach(async () => {
    mockTempDir = '/tmp/repo-clone-abc123';
    mockGit = {
      timeout: vi.fn().mockReturnThis(),
      clone: vi.fn(),
      revparse: vi.fn()
    };
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(fs.mkdtemp).mockResolvedValue(mockTempDir);
    vi.mocked(fs.rm).mockResolvedValue();
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.stat).mockResolvedValue({ size: 1024 } as fs.Stats);
    
    // Get the mocked simpleGit function
    const { simpleGit } = await import('simple-git');
    mockSimpleGit = simpleGit;
    mockSimpleGit.mockReturnValue(mockGit);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('cloneRepository', () => {
    it('should successfully clone a valid repository', async () => {
      const repositoryUrl = 'https://github.com/owner/repo.git';
      
      // Mock successful git operations
      mockGit.clone.mockResolvedValue(undefined);
      mockGit.revparse
        .mockResolvedValueOnce('abc123') // HEAD commit
        .mockResolvedValueOnce('main');  // branch
      
      // Mock directory structure
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'file1.txt', isFile: () => true, isDirectory: () => false } as fs.Dirent,
        { name: '.git', isFile: () => false, isDirectory: () => true } as fs.Dirent
      ]);
      
      // Import the function after mocking
      const { cloneRepository } = await import('../../../lib/git/repository');
      const result = await cloneRepository(repositoryUrl);
      
      expect(result.path).toBe(mockTempDir);
      expect(result.metadata.name).toBe('repo');
      expect(result.metadata.owner).toBe('owner');
      expect(result.metadata.commitHash).toBe('abc123');
      expect(result.metadata.branch).toBe('main');
      expect(typeof result.cleanup).toBe('function');
      
      // Verify git operations were called
      expect(mockGit.clone).toHaveBeenCalledWith(repositoryUrl, mockTempDir, {
        '--depth': '1',
        '--branch': 'main',
        '--single-branch': 'true'
      });
    });
    
    it('should handle invalid repository URLs', async () => {
      const invalidUrl = 'not-a-valid-url';
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      await expect(cloneRepository(invalidUrl)).rejects.toThrow('Invalid repository URL provided');
      
      // Verify no git operations were attempted
      expect(mockGit.clone).not.toHaveBeenCalled();
    });
    
    it('should handle private repository access issues', async () => {
      const repositoryUrl = 'https://github.com/owner/private-repo.git';
      
      // Mock authentication failure
      mockGit.clone.mockRejectedValue(new Error('Authentication failed'));
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      await expect(cloneRepository(repositoryUrl)).rejects.toThrow('Repository is private or requires authentication');
      
      // Verify cleanup was attempted
      expect(fs.rm).toHaveBeenCalledWith(mockTempDir, { recursive: true, force: true });
    });
    
    it('should handle repository not found errors', async () => {
      const repositoryUrl = 'https://github.com/owner/nonexistent-repo.git';
      
      // Mock repository not found
      mockGit.clone.mockRejectedValue(new Error('Repository not found'));
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      await expect(cloneRepository(repositoryUrl)).rejects.toThrow('Repository not found or access denied');
      
      // Verify cleanup was attempted
      expect(fs.rm).toHaveBeenCalledWith(mockTempDir, { recursive: true, force: true });
    });
    
    it('should handle timeout errors', async () => {
      const repositoryUrl = 'https://github.com/owner/slow-repo.git';
      
      // Mock timeout error
      mockGit.clone.mockRejectedValue(new Error('timeout'));
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      await expect(cloneRepository(repositoryUrl)).rejects.toThrow('Repository cloning timed out');
      
      // Verify cleanup was attempted
      expect(fs.rm).toHaveBeenCalledWith(mockTempDir, { recursive: true, force: true });
    });
    
    it('should handle network errors gracefully', async () => {
      const repositoryUrl = 'https://github.com/owner/repo.git';
      
      // Mock network error
      mockGit.clone.mockRejectedValue(new Error('Network error'));
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      await expect(cloneRepository(repositoryUrl)).rejects.toThrow('Failed to clone repository. Please check the URL and try again.');
      
      // Verify cleanup was attempted
      expect(fs.rm).toHaveBeenCalledWith(mockTempDir, { recursive: true, force: true });
    });
    
    it('should use custom options when provided', async () => {
      const repositoryUrl = 'https://github.com/owner/repo.git';
      const options = {
        timeout: 600000, // 10 minutes
        depth: 5,
        branch: 'develop'
      };
      
      // Mock successful git operations
      mockGit.clone.mockResolvedValue(undefined);
      mockGit.revparse
        .mockResolvedValueOnce('abc123')
        .mockResolvedValueOnce('develop');
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      await cloneRepository(repositoryUrl, options);
      
      // Verify custom options were used
      expect(mockGit.clone).toHaveBeenCalledWith(repositoryUrl, mockTempDir, {
        '--depth': '5',
        '--branch': 'develop',
        '--single-branch': 'true'
      });
    });
    
    it('should handle metadata extraction failures gracefully', async () => {
      const repositoryUrl = 'https://github.com/owner/repo.git';
      
      // Mock successful clone but failed metadata extraction
      mockGit.clone.mockResolvedValue(undefined);
      mockGit.revparse.mockRejectedValue(new Error('Git command failed'));
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      const result = await cloneRepository(repositoryUrl);
      
      // Should still return result with default metadata values
      expect(result.path).toBe(mockTempDir);
      expect(result.metadata.commitHash).toBe('unknown');
      expect(result.metadata.branch).toBe('unknown');
      expect(result.metadata.size).toBe(0);
      expect(result.metadata.fileCount).toBe(0);
    });
    
    it('should handle cleanup function execution', async () => {
      const repositoryUrl = 'https://github.com/owner/repo.git';
      
      // Mock successful clone
      mockGit.clone.mockResolvedValue(undefined);
      mockGit.revparse
        .mockResolvedValueOnce('abc123')
        .mockResolvedValueOnce('main');
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      const result = await cloneRepository(repositoryUrl);
      
      // Execute cleanup function
      await result.cleanup();
      
      // Verify cleanup was called
      expect(fs.rm).toHaveBeenCalledWith(mockTempDir, { recursive: true, force: true });
    });
    
    it('should handle cleanup failures gracefully', async () => {
      const repositoryUrl = 'https://github.com/owner/repo.git';
      
      // Mock successful clone
      mockGit.clone.mockResolvedValue(undefined);
      mockGit.revparse
        .mockResolvedValueOnce('abc123')
        .mockResolvedValueOnce('main');
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      const result = await cloneRepository(repositoryUrl);
      
      // Mock cleanup failure
      vi.mocked(fs.rm).mockRejectedValue(new Error('Cleanup failed'));
      
      // Cleanup should not throw even when fs.rm fails
      await expect(result.cleanup()).resolves.toBeUndefined();
    });
  });
  
  describe('URL validation', () => {
    it('should accept valid HTTP URLs', async () => {
      const validUrls = [
        'https://github.com/owner/repo.git',
        'http://github.com/owner/repo.git',
        'https://gitlab.com/owner/repo.git',
        'https://bitbucket.org/owner/repo.git'
      ];
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      for (const url of validUrls) {
        // Mock git operations to fail after validation
        mockGit.clone.mockRejectedValue(new Error('Git operation failed'));
        
        // Should not throw validation error, but should fail at git operations
        // The error gets caught and re-thrown as a generic error
        await expect(cloneRepository(url)).rejects.toThrow('Failed to clone repository');
      }
    });
    
    it('should accept valid SSH URLs', async () => {
      const validUrls = [
        'ssh://git@github.com/owner/repo.git'
      ];
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      for (const url of validUrls) {
        // Mock git operations to fail after validation
        mockGit.clone.mockRejectedValue(new Error('Git operation failed'));
        
        // Should not throw validation error, but should fail at git operations
        // The error gets caught and re-thrown as a generic error
        await expect(cloneRepository(url)).rejects.toThrow('Failed to clone repository');
      }
    });
    
    it('should reject invalid URLs', async () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid.com',
        'mailto:test@example.com',
        '',
        '   ',
        'github.com/owner/repo' // Missing protocol
      ];
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      for (const url of invalidUrls) {
        await expect(cloneRepository(url)).rejects.toThrow('Invalid repository URL provided');
      }
    });
  });
  
  describe('Repository metadata parsing', () => {
    it('should correctly parse GitHub URLs', async () => {
      const repositoryUrl = 'https://github.com/owner/repo-name.git';
      
      // Mock successful clone
      mockGit.clone.mockResolvedValue(undefined);
      mockGit.revparse
        .mockResolvedValueOnce('abc123')
        .mockResolvedValueOnce('main');
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      const result = await cloneRepository(repositoryUrl);
      
      expect(result.metadata.name).toBe('repo-name');
      expect(result.metadata.owner).toBe('owner');
    });
    
    it('should handle URLs without .git extension', async () => {
      const repositoryUrl = 'https://github.com/owner/repo-name';
      
      // Mock successful clone
      mockGit.clone.mockResolvedValue(undefined);
      mockGit.revparse
        .mockResolvedValueOnce('abc123')
        .mockResolvedValueOnce('main');
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      const result = await cloneRepository(repositoryUrl);
      
      expect(result.metadata.name).toBe('repo-name');
      expect(result.metadata.owner).toBe('owner');
    });
    
    it('should handle malformed URLs gracefully', async () => {
      const repositoryUrl = 'https://github.com/';
      
      // Mock successful clone
      mockGit.clone.mockResolvedValue(undefined);
      mockGit.revparse
        .mockResolvedValueOnce('abc123')
        .mockResolvedValueOnce('main');
      
      const { cloneRepository } = await import('../../../lib/git/repository');
      const result = await cloneRepository(repositoryUrl);
      
      expect(result.metadata.name).toBe('unknown');
      expect(result.metadata.owner).toBe('unknown');
    });
  });
});
