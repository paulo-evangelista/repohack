import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DynamicThreatDisplay } from '../../components/DynamicThreatDisplay';
import { GenericThreat } from '../../lib/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileText: ({ className }: { className?: string }) => <div data-testid="file-text" className={className} />,
  MapPin: ({ className }: { className?: string }) => <div data-testid="map-pin" className={className} />,
  AlertTriangle: ({ className }: { className?: string }) => <div data-testid="alert-triangle" className={className} />,
  Info: ({ className }: { className?: string }) => <div data-testid="info" className={className} />,
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-circle" className={className} />,
  ChevronDown: ({ className }: { className?: string }) => <div data-testid="chevron-down" className={className} />,
  ChevronRight: ({ className }: { className?: string }) => <div data-testid="chevron-right" className={className} />,
}));

describe('DynamicThreatDisplay', () => {
  const mockThreat: GenericThreat = {
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

  describe('Basic Rendering', () => {
    it('renders threat information correctly', () => {
      render(<DynamicThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByText('Code Execution - Eval Function')).toBeInTheDocument();
      expect(screen.getByText('Dangerous eval function detected that could execute arbitrary code')).toBeInTheDocument();
      expect(screen.getByText('src/main.js')).toBeInTheDocument();
      const lineElements = screen.getAllByText(/Line 42/);
      expect(lineElements.length).toBeGreaterThan(0);
    });

    it('applies custom className when provided', () => {
      const { container } = render(<DynamicThreatDisplay threat={mockThreat} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Severity Display', () => {
    it('displays CRITICAL severity correctly', () => {
      render(<DynamicThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByTestId('x-circle')).toBeInTheDocument();
      expect(screen.getByText('CRITICAL')).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('displays WARNING severity correctly', () => {
      const warningThreat = { ...mockThreat, severity: 'WARNING' };
      render(<DynamicThreatDisplay threat={warningThreat} />);
      
      expect(screen.getByText('WARNING')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
      expect(screen.getByText('WARNING')).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('displays INFO severity correctly', () => {
      const infoThreat = { ...mockThreat, severity: 'INFO' };
      render(<DynamicThreatDisplay threat={infoThreat} />);
      
      expect(screen.getByText('INFO')).toBeInTheDocument();
      expect(screen.getByTestId('info')).toBeInTheDocument();
      expect(screen.getByText('INFO')).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('handles unknown severity gracefully', () => {
      const unknownThreat = { ...mockThreat, severity: 'UNKNOWN' };
      render(<DynamicThreatDisplay threat={unknownThreat} />);
      
      expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
      expect(screen.getByText('UNKNOWN')).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('File Location Display', () => {
    it('displays file path with file icon', () => {
      render(<DynamicThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByTestId('file-text')).toBeInTheDocument();
      expect(screen.getByText('src/main.js')).toBeInTheDocument();
    });

    it('displays line number with map pin icon when line exists', () => {
      render(<DynamicThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByTestId('map-pin')).toBeInTheDocument();
      const lineElements = screen.getAllByText(/Line 42/);
      expect(lineElements.length).toBeGreaterThan(0);
    });

    it('does not display line number when line is 0', () => {
      const threatWithoutLine = { ...mockThreat, line: 0 };
      render(<DynamicThreatDisplay threat={threatWithoutLine} />);
      
      expect(screen.queryByText(/Line/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('map-pin')).not.toBeInTheDocument();
    });
  });

  describe('Code Snippet Display', () => {
    it('displays code snippet when code exists', () => {
      render(<DynamicThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByText('Code Snippet')).toBeInTheDocument();
      expect(screen.getByText('eval(userInput)')).toBeInTheDocument();
    });

    it('does not display code snippet section when code is empty', () => {
      const threatWithoutCode = { ...mockThreat, code: '' };
      render(<DynamicThreatDisplay threat={threatWithoutCode} />);
      
      expect(screen.queryByText('Code Snippet')).not.toBeInTheDocument();
    });
  });

  describe('Additional Details Display', () => {
    it('displays additional details when they exist', () => {
      render(<DynamicThreatDisplay threat={mockThreat} />);
      
      expect(screen.getByText('Additional Details')).toBeInTheDocument();
      expect(screen.getByText('Risk:')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('Recommendation:')).toBeInTheDocument();
      expect(screen.getByText('Use JSON.parse instead')).toBeInTheDocument();
    });

    it('does not display additional details section when details is empty', () => {
      const threatWithEmptyDetails = { ...mockThreat, details: {} };
      render(<DynamicThreatDisplay threat={threatWithEmptyDetails} />);
      
      expect(screen.queryByText('Additional Details')).not.toBeInTheDocument();
    });
  });

  describe('Dynamic Fields Display', () => {
    const threatWithExtraFields: GenericThreat = {
      ...mockThreat,
      customField: 'custom value',
      numericField: 123,
      booleanField: true,
      arrayField: [1, 2, 3],
      objectField: { nested: 'value' }
    };

    it('shows additional fields when showAllFields is true', () => {
      render(<DynamicThreatDisplay threat={threatWithExtraFields} showAllFields={true} />);
      
      expect(screen.getByText('Additional Fields')).toBeInTheDocument();
      expect(screen.getByText('Show Details')).toBeInTheDocument();
    });

    it('hides additional fields by default', () => {
      render(<DynamicThreatDisplay threat={threatWithExtraFields} showAllFields={false} />);
      
      expect(screen.queryByText('Additional Fields')).not.toBeInTheDocument();
    });

    it('toggles additional fields visibility', () => {
      render(<DynamicThreatDisplay threat={threatWithExtraFields} showAllFields={true} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
      expect(screen.getByText('Custom Field:')).toBeInTheDocument();
      expect(screen.getByText('custom value')).toBeInTheDocument();
    });

    it('expands and collapses complex fields', () => {
      render(<DynamicThreatDisplay threat={threatWithExtraFields} showAllFields={true} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      const chevronButtons = screen.getAllByTestId('chevron-right');
      if (chevronButtons.length > 0) {
        fireEvent.click(chevronButtons[0]);
        expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
      }
    });
  });

  describe('Field Value Rendering', () => {
    it('renders string values correctly', () => {
      const stringThreat = { ...mockThreat, stringField: 'test string' };
      render(<DynamicThreatDisplay threat={stringThreat} showAllFields={true} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('test string')).toBeInTheDocument();
    });

    it('renders number values correctly', () => {
      const numberThreat = { ...mockThreat, numberField: 42 };
      render(<DynamicThreatDisplay threat={numberThreat} showAllFields={true} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      const numberElements = screen.getAllByText('42');
      expect(numberElements.length).toBeGreaterThan(0);
    });

    it('renders boolean values correctly', () => {
      const booleanThreat = { ...mockThreat, booleanField: true };
      render(<DynamicThreatDisplay threat={booleanThreat} showAllFields={true} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('renders array values correctly', () => {
      const arrayThreat = { ...mockThreat, arrayField: [1, 2, 3] };
      render(<DynamicThreatDisplay threat={arrayThreat} showAllFields={true} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Array (3 items)')).toBeInTheDocument();
    });

    it('renders object values correctly', () => {
      const objectThreat = { ...mockThreat, objectField: { key: 'value' } };
      render(<DynamicThreatDisplay threat={objectThreat} showAllFields={true} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Object (1 properties)')).toBeInTheDocument();
    });

    it('renders null and undefined values correctly', () => {
      const nullThreat = { ...mockThreat, nullField: null, undefinedField: undefined };
      render(<DynamicThreatDisplay threat={nullThreat} showAllFields={true} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('null')).toBeInTheDocument();
      expect(screen.getByText('undefined')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles threat with minimal fields', () => {
      const minimalThreat: GenericThreat = {
        category: 'Test',
        subcategory: 'Test',
        severity: 'INFO',
        description: 'Test description',
        file: 'test.js'
      };
      
      render(<DynamicThreatDisplay threat={minimalThreat} />);
      
      expect(screen.getByText('Test - Test')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('test.js')).toBeInTheDocument();
    });

    it('handles threat with missing common fields', () => {
      const minimalThreat: GenericThreat = {
        customField: 'custom value'
      };
      
      render(<DynamicThreatDisplay threat={minimalThreat} />);
      
      expect(screen.getByText('Unknown - General')).toBeInTheDocument();
      expect(screen.getByText('No description available')).toBeInTheDocument();
      expect(screen.getByText('Unknown file')).toBeInTheDocument();
    });

    it('handles very long descriptions gracefully', () => {
      const longDescription = 'A'.repeat(500);
      const threatWithLongDesc = { ...mockThreat, description: longDescription };
      
      render(<DynamicThreatDisplay threat={threatWithLongDesc} />);
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure for threat details', () => {
      render(<DynamicThreatDisplay threat={mockThreat} />);
      
      const categoryHeading = screen.getByText('Code Execution - Eval Function');
      expect(categoryHeading.tagName).toBe('H4');
    });

    it('provides proper button labels for field expansion', () => {
      const threatWithExtraFields = { ...mockThreat, customField: 'value' };
      render(<DynamicThreatDisplay threat={threatWithExtraFields} showAllFields={true} />);
      
      const toggleButton = screen.getByText('Show Details');
      expect(toggleButton).toBeInTheDocument();
    });
  });
});
