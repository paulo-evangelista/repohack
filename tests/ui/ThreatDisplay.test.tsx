import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThreatDisplay } from '../../components/ThreatDisplay';
import { ThreatResult } from '../../lib/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileText: ({ className }: { className?: string }) => <div data-testid="file-text" className={className} />,
  MapPin: ({ className }: { className?: string }) => <div data-testid="map-pin" className={className} />,
  AlertTriangle: ({ className }: { className?: string }) => <div data-testid="alert-triangle" className={className} />,
  Info: ({ className }: { className?: string }) => <div data-testid="info" className={className} />,
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-circle" className={className} />,
}));

describe('ThreatDisplay', () => {
  const mockThreat: ThreatResult = {
    category: 'Code Execution',
    subcategory: 'Eval Function',
    severity: 'CRITICAL',
    description: 'Dangerous eval function detected that could execute arbitrary code',
    file: 'src/main.js',
    line: 42,
    code: 'eval(userInput)',
    details: {
      risk: 'high',
      recommendation: 'Use JSON.parse instead',
      cwe: 'CWE-78'
    }
  };

  describe('Rendering', () => {
    it('renders threat information correctly', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByText('Code Execution - Eval Function')).toBeInTheDocument();
      expect(screen.getByText('Dangerous eval function detected that could execute arbitrary code')).toBeInTheDocument();
      expect(screen.getByText('src/main.js')).toBeInTheDocument();
      const lineElements = screen.getAllByText('Line 42');
      expect(lineElements.length).toBeGreaterThan(0);
    });

    it('applies custom className when provided', () => {
      const { container } = render(<ThreatDisplay threat={mockThreat} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Severity Display', () => {
    it('displays CRITICAL severity correctly', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByTestId('x-circle')).toBeInTheDocument();
      expect(screen.getByText('CRITICAL')).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('displays WARNING severity correctly', () => {
      const warningThreat = { ...mockThreat, severity: 'WARNING' as const };
      render(<ThreatDisplay threat={warningThreat} />);
      
      expect(screen.getByText('WARNING')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
      expect(screen.getByText('WARNING')).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('displays INFO severity correctly', () => {
      const infoThreat = { ...mockThreat, severity: 'INFO' as const };
      render(<ThreatDisplay threat={infoThreat} />);
      
      expect(screen.getByText('INFO')).toBeInTheDocument();
      expect(screen.getByTestId('info')).toBeInTheDocument();
      expect(screen.getByText('INFO')).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('handles unknown severity gracefully', () => {
      const unknownThreat = { ...mockThreat, severity: 'UNKNOWN' as any };
      render(<ThreatDisplay threat={unknownThreat} />);
      
      expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
      expect(screen.getByText('UNKNOWN')).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('File Location Display', () => {
    it('displays file path with file icon', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByTestId('file-text')).toBeInTheDocument();
      expect(screen.getByText('src/main.js')).toBeInTheDocument();
    });

    it('displays line number with map pin icon when line exists', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByTestId('map-pin')).toBeInTheDocument();
      const lineElements = screen.getAllByText('Line 42');
      expect(lineElements.length).toBeGreaterThan(0);
    });

    it('does not display line number when line is undefined', () => {
      const threatWithoutLine = { ...mockThreat, line: undefined };
      render(<ThreatDisplay threat={threatWithoutLine} />);
      
      expect(screen.queryByText(/Line/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('map-pin')).not.toBeInTheDocument();
    });

    it('displays file path and line number in correct format', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const locationText = screen.getByText('src/main.js');
      const lineElements = screen.getAllByText('Line 42');
      
      expect(locationText).toBeInTheDocument();
      expect(lineElements.length).toBeGreaterThan(0);
    });
  });

  describe('Code Snippet Display', () => {
    it('displays code snippet when code exists', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByText('Code Snippet')).toBeInTheDocument();
      expect(screen.getByText('eval(userInput)')).toBeInTheDocument();
    });

    it('does not display code snippet section when code is undefined', () => {
      const threatWithoutCode = { ...mockThreat, code: undefined };
      render(<ThreatDisplay threat={threatWithoutCode} />);
      
      expect(screen.queryByText('Code Snippet')).not.toBeInTheDocument();
    });

    it('displays line number in code snippet header when available', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const codeHeader = screen.getByText('Code Snippet').closest('div');
      expect(codeHeader).toHaveTextContent('Line 42');
    });

    it('applies severity-based background color to code snippet', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const codeContainer = screen.getByText('eval(userInput)').closest('div');
      expect(codeContainer).toHaveClass('bg-red-50', 'dark:bg-red-900/10');
    });

    it('uses monospace font for code display', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const codeElement = screen.getByText('eval(userInput)');
      expect(codeElement.closest('pre')).toHaveClass('font-mono');
    });
  });

  describe('Additional Details Display', () => {
    it('displays additional details when they exist', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByText('Additional Details')).toBeInTheDocument();
      expect(screen.getByText('risk:')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('recommendation:')).toBeInTheDocument();
      expect(screen.getByText('Use JSON.parse instead')).toBeInTheDocument();
    });

    it('does not display additional details section when details is undefined', () => {
      const threatWithoutDetails = { ...mockThreat, details: undefined };
      render(<ThreatDisplay threat={threatWithoutDetails} />);
      
      expect(screen.queryByText('Additional Details')).not.toBeInTheDocument();
    });

    it('does not display additional details section when details is empty', () => {
      const threatWithEmptyDetails = { ...mockThreat, details: {} };
      render(<ThreatDisplay threat={threatWithEmptyDetails} />);
      
      expect(screen.queryByText('Additional Details')).not.toBeInTheDocument();
    });

    it('formats detail keys with proper spacing', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByText('risk:')).toBeInTheDocument();
      expect(screen.getByText('recommendation:')).toBeInTheDocument();
      expect(screen.getByText('cwe:')).toBeInTheDocument();
    });

    it('handles non-string detail values correctly', () => {
      const threatWithComplexDetails = {
        ...mockThreat,
        details: {
          number: 42,
          boolean: true,
          object: { nested: 'value' },
          array: [1, 2, 3]
        }
      };
      
      render(<ThreatDisplay threat={threatWithComplexDetails} />);
      
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
      expect(screen.getByText('{"nested":"value"}')).toBeInTheDocument();
      expect(screen.getByText('[1,2,3]')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies base styling classes', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const container = screen.getByText('Code Execution - Eval Function').closest('div')?.parentElement;
      expect(container).toHaveClass('bg-white', 'dark:bg-gray-900', 'rounded-lg', 'border');
    });

    it('applies severity-based styling to severity badge', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const severityBadge = screen.getByText('CRITICAL');
      expect(severityBadge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });

    it('uses proper spacing between sections', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const description = screen.getByText('Dangerous eval function detected that could execute arbitrary code');
      const descriptionContainer = description.closest('div');
      expect(descriptionContainer).toHaveClass('mb-3');
    });

    it('applies proper border styling to additional details section', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const detailsSection = screen.getByText('Additional Details').closest('div');
      expect(detailsSection).toHaveClass('border-t', 'border-gray-200', 'dark:border-gray-700');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure for threat details', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const categoryHeading = screen.getByText('Code Execution - Eval Function');
      expect(categoryHeading.tagName).toBe('H4');
    });

    it('provides proper text contrast with severity badges', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const criticalBadge = screen.getByText('CRITICAL');
      expect(criticalBadge).toHaveClass('text-red-800', 'dark:text-red-400');
    });

    it('uses semantic HTML elements', () => {
      render(<ThreatDisplay threat={mockThreat} />);
      
      const codeElement = screen.getByText('eval(userInput)');
      expect(codeElement.tagName).toBe('CODE');
      expect(codeElement.closest('pre')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles threat without any optional fields', () => {
      const minimalThreat: ThreatResult = {
        category: 'Test',
        subcategory: 'Test',
        severity: 'INFO',
        description: 'Test description',
        file: 'test.js'
      };
      
      render(<ThreatDisplay threat={minimalThreat} />);
      
      expect(screen.getByText('Test - Test')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('test.js')).toBeInTheDocument();
      expect(screen.queryByText('Code Snippet')).not.toBeInTheDocument();
      expect(screen.queryByText('Additional Details')).not.toBeInTheDocument();
    });

    it('handles very long descriptions gracefully', () => {
      const longDescription = 'A'.repeat(500);
      const threatWithLongDesc = { ...mockThreat, description: longDescription };
      
      render(<ThreatDisplay threat={threatWithLongDesc} />);
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles special characters in file paths', () => {
      const threatWithSpecialChars = { ...mockThreat, file: 'src/components/User-Input.tsx' };
      
      render(<ThreatDisplay threat={threatWithSpecialChars} />);
      
      expect(screen.getByText('src/components/User-Input.tsx')).toBeInTheDocument();
    });
  });
});
