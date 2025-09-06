import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DynamicScanResults } from '../../components/DynamicScanResults';
import { GenericScanResult, GenericThreat } from '../../lib/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => <div data-testid="chevron-down" className={className} />,
  ChevronRight: ({ className }: { className?: string }) => <div data-testid="chevron-right" className={className} />,
  AlertTriangle: ({ className }: { className?: string }) => <div data-testid="alert-triangle" className={className} />,
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle" className={className} />,
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-circle" className={className} />,
  Info: ({ className }: { className?: string }) => <div data-testid="info" className={className} />,
}));

describe('DynamicScanResults', () => {
  const mockScanResult: GenericScanResult = {
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

  const mockThreats: GenericThreat[] = [
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
      render(<DynamicScanResults scanResult={null} isLoading={true} />);
      
      expect(screen.getByText('Scanning repository...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });
  });

  describe('Invalid Data Handling', () => {
    it('displays error message for invalid scan result', () => {
      render(<DynamicScanResults scanResult={null} isLoading={false} />);
      
      expect(screen.getByText('Invalid Scan Result')).toBeInTheDocument();
      expect(screen.getByText('The scan result data is not in the expected format.')).toBeInTheDocument();
    });

    it('handles non-object scan result', () => {
      render(<DynamicScanResults scanResult={'invalid' as any} isLoading={false} />);
      
      expect(screen.getByText('Invalid Scan Result')).toBeInTheDocument();
    });
  });

  describe('Overall Security Status Display', () => {
    it('displays SAFE status correctly', () => {
      render(<DynamicScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.getByText('Security Status')).toBeInTheDocument();
      expect(screen.getByText('SAFE')).toBeInTheDocument();
      const checkCircles = screen.getAllByTestId('check-circle');
      expect(checkCircles.length).toBeGreaterThan(0);
    });

    it('displays WARNING status correctly', () => {
      const warningResult = { ...mockScanResult, overallStatus: 'WARNING' };
      render(<DynamicScanResults scanResult={warningResult} isLoading={false} />);
      
      expect(screen.getByText('WARNING')).toBeInTheDocument();
      const alertTriangles = screen.getAllByTestId('alert-triangle');
      expect(alertTriangles.length).toBeGreaterThan(0);
    });

    it('displays UNSAFE status correctly', () => {
      const unsafeResult = { ...mockScanResult, overallStatus: 'UNSAFE' };
      render(<DynamicScanResults scanResult={unsafeResult} isLoading={false} />);
      
      expect(screen.getByText('UNSAFE')).toBeInTheDocument();
      const xCircles = screen.getAllByTestId('x-circle');
      expect(xCircles.length).toBeGreaterThan(0);
    });

    it('handles unknown status gracefully', () => {
      const unknownResult = { ...mockScanResult, overallStatus: 'UNKNOWN' };
      render(<DynamicScanResults scanResult={unknownResult} isLoading={false} />);
      
      expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
      const infoIcons = screen.getAllByTestId('info');
      expect(infoIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Repository Metadata Display', () => {
    it('displays repository details correctly', () => {
      render(<DynamicScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.getByText('Repository Details')).toBeInTheDocument();
      expect(screen.getByText('test-user/test-repo')).toBeInTheDocument();
      expect(screen.getByText('1.00 MB')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('main')).toBeInTheDocument();
    });

    it('handles missing metadata fields gracefully', () => {
      const minimalResult = {
        ...mockScanResult,
        repository: {
          metadata: {
            name: 'test-repo'
          }
        }
      };
      
      render(<DynamicScanResults scanResult={minimalResult} isLoading={false} />);
      
      expect(screen.getByText('Repository Details')).toBeInTheDocument();
      expect(screen.getByText('test-repo')).toBeInTheDocument();
    });
  });

  describe('Dynamic Scan Result Fields', () => {
    it('displays additional scan result fields', () => {
      const resultWithExtraFields = {
        ...mockScanResult,
        scanId: 'scan-123',
        scanDuration: 5000,
        scannerVersion: '1.0.0'
      };
      
      render(<DynamicScanResults scanResult={resultWithExtraFields} isLoading={false} />);
      
      expect(screen.getByText('Scan Information')).toBeInTheDocument();
      expect(screen.getByText('Scan Id')).toBeInTheDocument();
      expect(screen.getByText('scan-123')).toBeInTheDocument();
      expect(screen.getByText('Scan Duration')).toBeInTheDocument();
      expect(screen.getByText('5000')).toBeInTheDocument();
    });
  });

  describe('Threats Display', () => {
    it('displays threats when they exist', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      expect(screen.getByText('Security Threats (3)')).toBeInTheDocument();
      expect(screen.getByText('Code Execution')).toBeInTheDocument();
      expect(screen.getByText('File System')).toBeInTheDocument();
    });

    it('groups threats by category and subcategory', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      // Check categories
      expect(screen.getByText('Code Execution')).toBeInTheDocument();
      expect(screen.getByText('File System')).toBeInTheDocument();
      
      // Subcategories are hidden by default (collapsed state)
      expect(screen.queryByText('Eval Function')).not.toBeInTheDocument();
      expect(screen.queryByText('Path Traversal')).not.toBeInTheDocument();
      expect(screen.queryByText('Function Constructor')).not.toBeInTheDocument();
    });

    it('expands category when clicked', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      const categoryButton = screen.getByText('Code Execution');
      fireEvent.click(categoryButton);
      
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      expect(screen.getByText('Eval Function')).toBeInTheDocument();
      expect(screen.getByText('Function Constructor')).toBeInTheDocument();
    });

    it('collapses category when clicked again', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      const categoryButton = screen.getByText('Code Execution');
      
      // Expand
      fireEvent.click(categoryButton);
      expect(screen.getByText('Eval Function')).toBeInTheDocument();
      
      // Collapse
      fireEvent.click(categoryButton);
      expect(screen.queryByText('Eval Function')).not.toBeInTheDocument();
    });
  });

  describe('Grouping by Different Fields', () => {
    it('groups threats by severity when groupByField is severity', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} groupByField="severity" />);
      
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByText('WARNING')).toBeInTheDocument();
      expect(screen.getByText('INFO')).toBeInTheDocument();
    });

    it('groups threats by file when groupByField is file', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} groupByField="file" />);
      
      expect(screen.getByText('Src/main.js')).toBeInTheDocument();
      expect(screen.getByText('Src/file.js')).toBeInTheDocument();
      expect(screen.getByText('Src/utils.js')).toBeInTheDocument();
    });
  });

  describe('Empty State Handling', () => {
    it('displays no threats message when threats array is empty', () => {
      render(<DynamicScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.getByText('No Security Threats Found')).toBeInTheDocument();
      expect(screen.getByText('The repository appears to be secure with no detected vulnerabilities.')).toBeInTheDocument();
      const checkCircles = screen.getAllByTestId('check-circle');
      expect(checkCircles.length).toBeGreaterThan(0);
    });

    it('displays no threats message when threats is undefined', () => {
      const resultWithoutThreats = { ...mockScanResult, threats: undefined };
      render(<DynamicScanResults scanResult={resultWithoutThreats} isLoading={false} />);
      
      expect(screen.getByText('No Security Threats Found')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('displays errors when they exist', () => {
      const resultWithErrors = {
        ...mockScanResult,
        errors: ['Repository access denied', 'Timeout during scan']
      };
      render(<DynamicScanResults scanResult={resultWithErrors} isLoading={false} />);
      
      expect(screen.getByText('Scan Errors (2)')).toBeInTheDocument();
      expect(screen.getByText('• Repository access denied')).toBeInTheDocument();
      expect(screen.getByText('• Timeout during scan')).toBeInTheDocument();
    });

    it('does not display errors section when no errors', () => {
      render(<DynamicScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.queryByText('Scan Errors')).not.toBeInTheDocument();
    });
  });

  describe('Show All Fields', () => {
    it('shows available threat fields when showAllFields is true', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} showAllFields={true} />);
      
      expect(screen.getByText('Available Threat Fields')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Severity')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('hides available threat fields when showAllFields is false', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} showAllFields={false} />);
      
      expect(screen.queryByText('Available Threat Fields')).not.toBeInTheDocument();
    });
  });

  describe('Dynamic Field Rendering', () => {
    it('renders threats with extra fields correctly', () => {
      const threatsWithExtraFields: GenericThreat[] = [
        {
          ...mockThreats[0],
          customField: 'custom value',
          numericField: 123,
          booleanField: true
        }
      ];
      
      const resultWithThreats = { ...mockScanResult, threats: threatsWithExtraFields };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} showAllFields={true} />);
      
      const categoryButton = screen.getByText('Code Execution');
      fireEvent.click(categoryButton);
      
      expect(screen.getByText('Eval Function')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<DynamicScanResults scanResult={mockScanResult} isLoading={false} />);
      
      expect(screen.getByRole('heading', { name: 'Security Status' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Repository Details' })).toBeInTheDocument();
    });

    it('provides proper button labels for category expansion', () => {
      const resultWithThreats = { ...mockScanResult, threats: mockThreats };
      render(<DynamicScanResults scanResult={resultWithThreats} isLoading={false} />);
      
      const categoryButton = screen.getByRole('button', { name: 'Code Execution' });
      expect(categoryButton).toBeInTheDocument();
    });
  });
});
