import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';

describe('LoadingIndicator Component', () => {
  it('renders with default props', () => {
    render(<LoadingIndicator />);
    const loader = screen.getByRole('status');
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveClass('animate-spin', 'rounded-full', 'border-2', 'w-6', 'h-6');
  });

  it('renders with small size', () => {
    render(<LoadingIndicator size="sm" />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveClass('w-4', 'h-4');
  });

  it('renders with medium size', () => {
    render(<LoadingIndicator size="md" />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveClass('w-6', 'h-6');
  });

  it('renders with large size', () => {
    render(<LoadingIndicator size="lg" />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveClass('w-8', 'h-8');
  });

  it('applies custom className', () => {
    render(<LoadingIndicator className="custom-loader" />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveClass('custom-loader');
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingIndicator />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveAttribute('aria-label', 'Loading');
  });

  it('has proper styling classes', () => {
    render(<LoadingIndicator />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveClass(
      'animate-spin',
      'rounded-full',
      'border-2',
      'border-muted',
      'border-t-primary'
    );
  });

  it('combines custom className with default classes', () => {
    render(<LoadingIndicator className="bg-red-500" />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveClass('bg-red-500', 'animate-spin', 'rounded-full');
  });

  it('renders with correct border styling', () => {
    render(<LoadingIndicator />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveClass('border-muted', 'border-t-primary');
  });

  it('has proper animation class', () => {
    render(<LoadingIndicator />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveClass('animate-spin');
  });

  it('maintains proper proportions for all sizes', () => {
    const { rerender } = render(<LoadingIndicator size="sm" />);
    let loader = screen.getByRole('status');
    expect(loader).toHaveClass('w-4', 'h-4');

    rerender(<LoadingIndicator size="md" />);
    loader = screen.getByRole('status');
    expect(loader).toHaveClass('w-6', 'h-6');

    rerender(<LoadingIndicator size="lg" />);
    loader = screen.getByRole('status');
    expect(loader).toHaveClass('w-8', 'h-8');
  });
});
