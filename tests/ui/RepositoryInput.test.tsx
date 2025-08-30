import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RepositoryInput } from '../../components/RepositoryInput';

// Mock the scan server action
vi.mock('../../lib/actions/scan', () => ({
  scanRepository: vi.fn()
}));

describe('RepositoryInput', () => {
  let mockScanRepository: ReturnType<typeof vi.fn>;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked scanRepository function
    const { scanRepository } = await import('../../lib/actions/scan');
    mockScanRepository = vi.mocked(scanRepository);
  });

  describe('Rendering', () => {
    it('renders the component with correct title and description', () => {
      render(<RepositoryInput />);
      
      expect(screen.getByRole('heading', { name: 'Scan Repository' })).toBeInTheDocument();
      expect(screen.getByText('Enter a GitHub repository URL to begin security analysis')).toBeInTheDocument();
      expect(screen.getByLabelText('Repository URL')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Scan Repository/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Learn More/i })).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(<RepositoryInput className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('URL Validation', () => {
    it('accepts valid GitHub repository URLs', () => {
      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      
      const validUrls = [
        'https://github.com/username/repository',
        'https://github.com/username/repository/',
        'https://github.com/username/repository.git'
      ];

      validUrls.forEach(url => {
        fireEvent.change(input, { target: { value: url } });
        expect(screen.queryByText(/Please enter a valid/)).not.toBeInTheDocument();
      });
    });

    it('accepts valid .git URLs', () => {
      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      
      const validUrls = [
        'https://gitlab.com/username/repository.git',
        'ssh://git@gitlab.com/username/repository.git',
        'git@gitlab.com:username/repository.git'
      ];

      validUrls.forEach(url => {
        fireEvent.change(input, { target: { value: url } });
        expect(screen.queryByText(/Please enter a valid/)).not.toBeInTheDocument();
      });
    });

    it('rejects invalid URLs', () => {
      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      
      const invalidUrls = [
        'not-a-url',
        'https://github.com',
        'https://github.com/username',
        'https://example.com/repo',
        'ftp://github.com/username/repo'
      ];

      invalidUrls.forEach(url => {
        fireEvent.change(input, { target: { value: url } });
        fireEvent.submit(screen.getByRole('button', { name: /Scan Repository/i }));
        
        expect(screen.getByText('Please enter a valid GitHub repository URL or .git URL')).toBeInTheDocument();
      });
    });

    it('shows error for empty URL submission', () => {
      render(<RepositoryInput />);
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });
      
      fireEvent.submit(submitButton);
      
      expect(screen.getByText('Repository URL is required')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls scanRepository with valid URL', async () => {
      const mockResult = {
        repository: {
          path: '/tmp/repo',
          metadata: {
            name: 'test-repo',
            owner: 'test-user',
            url: 'https://github.com/test-user/test-repo',
            size: 1000,
            fileCount: 10,
            commitHash: 'abc123',
            branch: 'main',
            cloneTime: new Date()
          },
          cleanup: vi.fn()
        },
        scanCompleted: true,
        errors: []
      };

      mockScanRepository.mockResolvedValue(mockResult);

      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });

      fireEvent.change(input, { target: { value: 'https://github.com/test-user/test-repo' } });
      fireEvent.submit(submitButton);

      await waitFor(() => {
        expect(mockScanRepository).toHaveBeenCalledWith('https://github.com/test-user/test-repo');
      });
    });

    it('calls onSubmit callback when provided', async () => {
      const mockOnSubmit = vi.fn();
      const mockResult = {
        repository: {
          path: '/tmp/repo',
          metadata: {
            name: 'test-repo',
            owner: 'test-user',
            url: 'https://github.com/test-user/test-repo',
            size: 1000,
            fileCount: 10,
            commitHash: 'abc123',
            branch: 'main',
            cloneTime: new Date()
          }
        },
        scanCompleted: true,
        errors: []
      };

      mockScanRepository.mockResolvedValue(mockResult);

      render(<RepositoryInput onSubmit={mockOnSubmit} />);
      const input = screen.getByLabelText('Repository URL');
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });

      fireEvent.change(input, { target: { value: 'https://github.com/test-user/test-repo' } });
      fireEvent.submit(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(mockResult);
      });
    });

    it('resets form after successful submission', async () => {
      const mockResult = {
        repository: {
          path: '/tmp/repo',
          metadata: {
            name: 'test-repo',
            owner: 'test-user',
            url: 'https://github.com/test-user/test-repo',
            size: 1000,
            fileCount: 10,
            commitHash: 'abc123',
            branch: 'main',
            cloneTime: new Date()
          },
          cleanup: vi.fn()
        },
        scanCompleted: true,
        errors: []
      };

      mockScanRepository.mockResolvedValue(mockResult);

      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });

      fireEvent.change(input, { target: { value: 'https://github.com/test-user/test-repo' } });
      fireEvent.submit(submitButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message from scanRepository', async () => {
      const errorMessage = 'Repository not found';
      mockScanRepository.mockRejectedValue(new Error(errorMessage));

      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });

      fireEvent.change(input, { target: { value: 'https://github.com/test-user/test-repo' } });
      fireEvent.submit(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('displays generic error for unknown errors', async () => {
      mockScanRepository.mockRejectedValue('Unknown error');

      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });

      fireEvent.change(input, { target: { value: 'https://github.com/test-user/test-repo' } });
      fireEvent.submit(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    it('clears error when user starts typing', () => {
      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });

      // Submit empty form to show error
      fireEvent.submit(submitButton);
      expect(screen.getByText('Repository URL is required')).toBeInTheDocument();

      // Start typing to clear error
      fireEvent.change(input, { target: { value: 'https://github.com' } });
      expect(screen.queryByText('Repository URL is required')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state during submission', async () => {
      // Create a promise that never resolves to simulate loading
      let resolvePromise: (value: any) => void;
      const loadingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockScanRepository.mockReturnValue(loadingPromise);

      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });

      fireEvent.change(input, { target: { value: 'https://github.com/test-user/test-repo' } });
      fireEvent.submit(submitButton);

      // Check loading state
      expect(screen.getByText('Scanning...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // LoadingIndicator
      expect(submitButton).toBeDisabled();
      expect(input).toBeDisabled();

      // Resolve the promise
      resolvePromise!({});
    });

    it('disables form elements during loading', async () => {
      let resolvePromise: (value: any) => void;
      const loadingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockScanRepository.mockReturnValue(loadingPromise);

      render(<RepositoryInput />);
      const input = screen.getByLabelText('Repository URL');
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });
      const learnMoreButton = screen.getByRole('button', { name: /Learn More/i });

      fireEvent.change(input, { target: { value: 'https://github.com/test-user/test-repo' } });
      fireEvent.submit(submitButton);

      expect(input).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(learnMoreButton).toBeDisabled();

      resolvePromise!({});
    });
  });

  describe('Button Behavior', () => {
    it('has correct button types', () => {
      render(<RepositoryInput />);
      
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });
      const learnMoreButton = screen.getByRole('button', { name: /Learn More/i });

      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(learnMoreButton).toHaveAttribute('type', 'button');
    });

    it('applies correct button variants', () => {
      render(<RepositoryInput />);
      
      const submitButton = screen.getByRole('button', { name: /Scan Repository/i });
      const learnMoreButton = screen.getByRole('button', { name: /Learn More/i });

      // Submit button should have primary variant (default)
      expect(submitButton).toHaveClass('bg-primary');
      // Learn More button should have outline variant
      expect(learnMoreButton).toHaveClass('border');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<RepositoryInput />);
      
      const input = screen.getByLabelText('Repository URL');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'url');
      expect(input).toHaveAttribute('required');
    });

    it('has proper button labels', () => {
      render(<RepositoryInput />);
      
      expect(screen.getByRole('button', { name: /Scan Repository/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Learn More/i })).toBeInTheDocument();
    });
  });
});
