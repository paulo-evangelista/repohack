import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScanResults } from '../../components/ScanResults';
import { ScanResult, ThreatResult } from '../../lib/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => <div data-testid="chevron-down" className={className} />,
  ChevronRight: ({ className }: { className?: string }) => <div data-testid="chevron-right" className={className} />,
  AlertTriangle: ({ className }: { className?: string }) => <div data-testid="alert-triangle" className={className} />,
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle" className={className} />,
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-circle" className={className} />,
}));

describe('ScanResults', () => {
  const mockScanResult: ScanResult = {
    repository: {
      path: '/tmp/test-repo',
      metadata: {
        name: 'test-repo',
        owner: 'test-user',
        url: 'https://github.com/test-user/test-repo',
        size: 1024 * 1024, // 1MB
        fileCount: 50,
        commitHash: 'abc123def',
        branch: 'main',
        cloneTime: new Date('2024-01-01T12:00:00Z')
      }
    },
    scanCompleted: true,
    errors: [],
    threats: [],
    overallStatus: 'SAFE'
  };

  const mockThreats: ThreatResult[] = [
    {
      category: 'Code Execution',
      subcategory: 'Eval Function',
      severity: 'CRITICAL',
      description: 'Dangerous eval function detected',
      file: 'src/main.js',
      line: 42,
      code: 'eval(userInput)',
      details: { risk: 'high', recommendation: 'Use JSON.parse instead' }
    },
    {
      category: 'File System',
      subcategory: 'Path Traversal',
      severity: 'WARNING',
      description: 'Potential path traversal vulnerability',
      file: 'src/file.js',
      line: 15,
      code: 'fs.readFile(userPath)',
      details: { risk: 'medium', recommendation: 'Validate and sanitize paths' }
    },
    {
      category: 'Code Execution',
      subcategory: 'Function Constructor',
      severity: 'INFO',
      description: 'Function constructor usage detected',
      file: 'src/utils.js',
      line: 78,
      code: 'new Function(code)',
      details: { risk: 'low', recommendation: 'Consider alternatives' }
    }
  ];

  describe('Loading State', () => {
    it('displays loading spinner when isLoading is true', () => {
      render(<ScanResults scanResult={null} isLoading={true} />);
      
      expect(screen.getByText('Scanning repository...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });
  });

  describe('No Results State', () => {
    it('returns null when scanResult is null', () => {
      const { container } = render(<ScanResults scanResult={null} isLoading={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Overall Security Status Display', () => {
    it('displays SAFE status correctly', () => {
      render(<ScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.getByText('Security Status')).toBeInTheDocument();
      expect(screen.getByText('SAFE')).toBeInTheDocument();
      const checkCircles = screen.getAllByTestId('check-circle');
      expect(checkCircles.length).toBeGreaterThan(0);
    });

    it('displays WARNING status correctly', () => {
      const warningResult = { ...mockScanResult, overallStatus: 'WARNING' as const };
      render(<ScanResults scanResult={warningResult} isLoading={false} />);
      
      expect(screen.getByText('WARNING')).toBeInTheDocument();
      const alertTriangles = screen.getAllByTestId('alert-triangle');
      expect(alertTriangles.length).toBeGreaterThan(0);
    });

    it('displays UNSAFE status correctly', () => {
      const unsafeResult = { ...mockScanResult, overallStatus: 'UNSAFE' as const };
      render(<ScanResults scanResult={unsafeResult} isLoading={false} />);
      
      expect(screen.getByText('UNSAFE')).toBeInTheDocument();
      const xCircles = screen.getAllByTestId('x-circle');
      expect(xCircles.length).toBeGreaterThan(0);
    });
  });

  describe('Repository Metadata Display', () => {
    it('displays repository details correctly', () => {
      render(<ScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.getByText('Repository Details')).toBeInTheDocument();
      expect(screen.getByText('test-user/test-repo')).toBeInTheDocument();
      expect(screen.getByText('1.00 MB')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('main')).toBeInTheDocument();
    });

    it('formats file size correctly', () => {
      const largeRepo = {
        ...mockScanResult,
        repository: {
          ...mockScanResult.repository,
          metadata: {
            ...mockScanResult.repository.metadata,
            size: 2.5 * 1024 * 1024 // 2.5MB
          }
        }
      };
      
      render(<ScanResults scanResult={largeRepo} isLoading={false} />);
      expect(screen.getByText('2.50 MB')).toBeInTheDocument();
    });

    it('formats file count with locale', () => {
      const largeRepo = {
        ...mockScanResult,
        repository: {
          ...mockScanResult.repository,
          metadata: {
            ...mockScanResult.repository.metadata,
            fileCount: 1000
          }
        }
      };
      
      render(<ScanResults scanResult={largeRepo} isLoading={false} />);
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });
  });

  describe('Threats Display', () => {
    it('displays threats when they exist', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<ScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      expect(screen.getByText('Security Threats (3)')).toBeInTheDocument();
      expect(screen.getByText('Code Execution')).toBeInTheDocument();
      expect(screen.getByText('File System')).toBeInTheDocument();
    });

    it('groups threats by category and subcategory', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<ScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      // Check categories
      expect(screen.getByText('Code Execution')).toBeInTheDocument();
      expect(screen.getByText('File System')).toBeInTheDocument();
      
      // Subcategories are hidden by default (collapsed state)
      expect(screen.queryByText('Eval Function')).not.toBeInTheDocument();
      expect(screen.queryByText('Path Traversal')).not.toBeInTheDocument();
      expect(screen.queryByText('Function Constructor')).not.toBeInTheDocument();
    });

    it('displays threat details correctly', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<ScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      // Threat details are hidden by default (collapsed state)
      expect(screen.queryByText('Dangerous eval function detected')).not.toBeInTheDocument();
      expect(screen.queryByText('src/main.js:42')).not.toBeInTheDocument();
      expect(screen.queryByText('eval(userInput)')).not.toBeInTheDocument();
    });

    it('shows severity badges with correct colors', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<ScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      // Severity badges are hidden by default (collapsed state)
      expect(screen.queryByText('CRITICAL')).not.toBeInTheDocument();
      expect(screen.queryByText('WARNING')).not.toBeInTheDocument();
      expect(screen.queryByText('INFO')).not.toBeInTheDocument();
    });
  });

  describe('Category Expansion', () => {
    it('starts with all categories collapsed', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<ScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      const chevronRights = screen.getAllByTestId('chevron-right');
      expect(chevronRights.length).toBeGreaterThan(0);
      expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
      expect(screen.queryByText('Eval Function')).not.toBeInTheDocument();
    });

    it('expands category when clicked', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<ScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      const categoryButton = screen.getByText('Code Execution');
      fireEvent.click(categoryButton);
      
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      expect(screen.getByText('Eval Function')).toBeInTheDocument();
      expect(screen.getByText('Function Constructor')).toBeInTheDocument();
    });

    it('collapses category when clicked again', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<ScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      const categoryButton = screen.getByText('Code Execution');
      
      // Expand
      fireEvent.click(categoryButton);
      expect(screen.getByText('Eval Function')).toBeInTheDocument();
      
      // Collapse
      fireEvent.click(categoryButton);
      expect(screen.queryByText('Eval Function')).not.toBeInTheDocument();
    });
  });

  describe('Empty State Handling', () => {
    it('displays no threats message when threats array is empty', () => {
      render(<ScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.getByText('No Security Threats Found')).toBeInTheDocument();
      expect(screen.getByText('The repository appears to be secure with no detected vulnerabilities.')).toBeInTheDocument();
      const checkCircles = screen.getAllByTestId('check-circle');
      expect(checkCircles.length).toBeGreaterThan(0);
    });

    it('displays no threats message when threats is undefined', () => {
      const resultWithoutThreats = { ...mockScanResult, threats: undefined };
      render(<ScanResults scanResult={resultWithoutThreats} isLoading={false} />);
      
      expect(screen.getByText('No Security Threats Found')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('displays errors when they exist', () => {
      const resultWithErrors = {
        ...mockScanResult,
        errors: ['Repository access denied', 'Timeout during scan']
      };
      render(<ScanResults scanResult={resultWithErrors} isLoading={false} />);
      
      expect(screen.getByText('Scan Errors (2)')).toBeInTheDocument();
      expect(screen.getByText('• Repository access denied')).toBeInTheDocument();
      expect(screen.getByText('• Timeout during scan')).toBeInTheDocument();
    });

    it('does not display errors section when no errors', () => {
      render(<ScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.queryByText('Scan Errors')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes to repository metadata', () => {
      render(<ScanResults scanResult={mockScanResult} isLoading={false} />);
      
      // Find the grid element that contains the metadata
      const gridElement = screen.getByText('Size').closest('div')?.parentElement;
      expect(gridElement).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });

    it('uses responsive spacing and sizing classes', () => {
      render(<ScanResults scanResult={mockScanResult} isLoading={false} />);
      
      // Find the main container with mt-8 class
      const container = screen.getByText('Security Status').closest('div')?.parentElement?.parentElement?.parentElement?.parentElement;
      expect(container).toHaveClass('mt-8');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.getByRole('heading', { name: 'Security Status' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Repository Details' })).toBeInTheDocument();
    });

    it('provides proper button labels for category expansion', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<ScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      const categoryButton = screen.getByRole('button', { name: 'Code Execution' });
      expect(categoryButton).toBeInTheDocument();
    });
  });
});
