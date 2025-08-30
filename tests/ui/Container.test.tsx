import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from '../../components/ui/Container';

describe('Container Component', () => {
  it('renders with default props', () => {
    render(<Container>Content</Container>);
    const container = screen.getByText('Content').closest('div');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'max-w-screen-xl');
  });

  it('renders with small max width', () => {
    render(<Container maxWidth="sm">Small Content</Container>);
    const container = screen.getByText('Small Content').closest('div');
    expect(container).toHaveClass('max-w-screen-sm');
  });

  it('renders with medium max width', () => {
    render(<Container maxWidth="md">Medium Content</Container>);
    const container = screen.getByText('Medium Content').closest('div');
    expect(container).toHaveClass('max-w-screen-md');
  });

  it('renders with large max width', () => {
    render(<Container maxWidth="lg">Large Content</Container>);
    const container = screen.getByText('Large Content').closest('div');
    expect(container).toHaveClass('max-w-screen-lg');
  });

  it('renders with extra large max width', () => {
    render(<Container maxWidth="xl">Extra Large Content</Container>);
    const container = screen.getByText('Extra Large Content').closest('div');
    expect(container).toHaveClass('max-w-screen-xl');
  });

  it('renders with 2xl max width', () => {
    render(<Container maxWidth="2xl">2XL Content</Container>);
    const container = screen.getByText('2XL Content').closest('div');
    expect(container).toHaveClass('max-w-screen-2xl');
  });

  it('renders with full max width', () => {
    render(<Container maxWidth="full">Full Content</Container>);
    const container = screen.getByText('Full Content').closest('div');
    expect(container).toHaveClass('max-w-full');
  });

  it('applies custom className', () => {
    render(<Container className="custom-container">Custom Content</Container>);
    const container = screen.getByText('Custom Content').closest('div');
    expect(container).toHaveClass('custom-container');
  });

  it('has responsive padding classes', () => {
    render(<Container>Responsive Content</Container>);
    const container = screen.getByText('Responsive Content').closest('div');
    expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
  });

  it('centers content horizontally', () => {
    render(<Container>Centered Content</Container>);
    const container = screen.getByText('Centered Content').closest('div');
    expect(container).toHaveClass('mx-auto');
  });

  it('renders children correctly', () => {
    render(
      <Container>
        <div data-testid="child">Child Element</div>
      </Container>
    );
    const child = screen.getByTestId('child');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Child Element');
  });

  it('combines custom className with default classes', () => {
    render(<Container className="bg-red-500">Combined Content</Container>);
    const container = screen.getByText('Combined Content').closest('div');
    expect(container).toHaveClass('bg-red-500', 'mx-auto', 'px-4');
  });
});
